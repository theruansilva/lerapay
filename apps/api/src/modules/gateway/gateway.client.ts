import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { User } from '../../database/entities';
import {
  GatewayLoginResponse,
  GatewayUserMeResponse,
  GatewayFeeItem,
  GatewayPixPaymentRequest,
  GatewayPixPaymentResponse,
  GatewayCardPaymentRequest,
  GatewayCardPaymentResponse,
  GatewayWalletResponse,
  GatewayTransactionItem,
  GatewayWithdrawalRequest,
  GatewayWithdrawalResponse,
} from './gateway.types';

@Injectable()
export class LeraBoxGatewayClient {
  private readonly logger = new Logger(LeraBoxGatewayClient.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const baseURL = this.config.get<string>(
      'GATEWAY_API_URL',
      'https://api.branchpay.com.br/api',
    );

    this.http = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getToken(merchantId: string): Promise<string> {
    const user = await this.userRepo.findOneBy({ id: merchantId });
    if (!user) {
      throw new HttpException('Merchant not found', HttpStatus.BAD_GATEWAY);
    }
    const now = Date.now();
    if (user.gatewayToken && Number(user.gatewayTokenExpiresAt || 0) > now + 60000) {
      return user.gatewayToken;
    }

    return this.authenticate(merchantId);
  }

  async authenticate(merchantId: string): Promise<string> {
    const user = await this.userRepo.findOneBy({ id: merchantId });
    if (!user) {
      throw new HttpException('Merchant not found', HttpStatus.BAD_GATEWAY);
    }

    const document = user.document;
    const password = user.gatewayPassword;
    const identifier = document;

    if (!identifier || !password) {
      throw new HttpException('Gateway credentials not configured for merchant', HttpStatus.BAD_GATEWAY);
    }

    try {
      this.logger.log(`Authenticating with Gateway at ${this.http.defaults.baseURL}/auth/login for ${identifier}`);
      const payload: Record<string, string> = { document, password };

      const response = await this.http.post<GatewayLoginResponse>('/auth/login', payload);

      const token = response.data.access_token || response.data.token;
      if (!token) {
        throw new Error('Token not found in login response');
      }

      user.gatewayToken = token;
      user.gatewayTokenExpiresAt = Date.now() + 12 * 60 * 60 * 1000;

      const clientCode = response.data.codigoCliente || response.data.CodigoCliente;
      const storeKey = response.data.chaveLoja || response.data.ChaveLoja;

      if (clientCode) {
        user.gatewayClientCode = String(clientCode);
      }
      if (storeKey) {
        user.gatewayStoreKey = String(storeKey);
      }

      await this.userRepo.save(user);
      this.logger.log(`Successfully authenticated with Gateway for merchant ${merchantId}`);
      return token;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gateway auth failed';
      this.logger.error(`Gateway authentication failed for merchant ${merchantId}: ${message}`);
      throw new HttpException(`Gateway authentication failed: ${message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  private async request<T>(merchantId: string, config: AxiosRequestConfig): Promise<T> {
    const token = await this.getToken(merchantId);
    try {
      const response = await this.http.request<T>({
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn(`Received 401 from Gateway for merchant ${merchantId}, refreshing token and retrying...`);
        const refreshedToken = await this.authenticate(merchantId);
        const retryResponse = await this.http.request<T>({
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${refreshedToken}`,
          },
        });
        return retryResponse.data;
      }
      const errMsg = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Unknown gateway error';
      this.logger.error(`Gateway request error on ${config.url} for merchant ${merchantId}: ${errMsg}`);
      throw new HttpException(
        `Gateway error: ${errMsg}`,
        axios.isAxiosError(error) && error.response?.status ? error.response.status : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getProfile(merchantId: string): Promise<GatewayUserMeResponse> {
    return this.request<GatewayUserMeResponse>(merchantId, {
      method: 'GET',
      url: '/users/me',
    });
  }

  async getFees(brand?: string): Promise<GatewayFeeItem[]> {
    try {
      const normalizedBrand = brand ? brand.toUpperCase() : undefined;
      const response = await this.http.get<GatewayFeeItem[] | { total?: number; fees?: GatewayFeeItem[] }>('/fees', {
        params: normalizedBrand ? { brand: normalizedBrand } : undefined,
      });

      let items: GatewayFeeItem[] = [];
      const rawData = response.data;
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && typeof rawData === 'object' && 'fees' in rawData && Array.isArray(rawData.fees)) {
        items = rawData.fees;
      }

      if (items.length > 0) {
        return items.map((f) => ({
          id: f.id,
          installments: Number(f.installments),
          feePercent: Number(f.feePercent),
          brand: f.brand || normalizedBrand || 'VISA',
          feePercentFormatted: f.feePercentFormatted,
        }));
      }

      return this.getDefaultFees(brand);
    } catch (error) {
      this.logger.warn('Failed to fetch public fees from gateway, using standard fallback table');
      return this.getDefaultFees(brand);
    }
  }

  private getDefaultFees(brand: string = 'Visa'): GatewayFeeItem[] {
    return [
      { installments: 1, feePercent: 2.99, brand },
      { installments: 2, feePercent: 3.49, brand },
      { installments: 3, feePercent: 3.99, brand },
      { installments: 6, feePercent: 5.49, brand },
      { installments: 12, feePercent: 8.99, brand },
    ];
  }

  async createPixPayment(merchantId: string, payload: GatewayPixPaymentRequest): Promise<GatewayPixPaymentResponse> {
    const data: Record<string, unknown> = {
      amount: payload.amount,
      payerDocument: (payload.payerDocument || '51145071848').replace(/\D/g, ''),
    };
    if (payload.externalReference) data.externalReference = payload.externalReference;
    if (payload.description) data.description = payload.description;

    return this.request<GatewayPixPaymentResponse>(merchantId, {
      method: 'POST',
      url: '/payments/pix',
      data,
    });
  }

  async createCardPayment(merchantId: string, payload: GatewayCardPaymentRequest): Promise<GatewayCardPaymentResponse> {
    const data: Record<string, unknown> = {
      amount: payload.amount,
      cardNumber: payload.cardNumber.replace(/\D/g, ''),
      cardHolder: payload.cardHolder || payload.cardHolderName || 'CLIENTE',
      expiryMonth: String(payload.expiryMonth || payload.cardExpirationMonth || '12').padStart(2, '0'),
      expiryYear: String(payload.expiryYear || payload.cardExpirationYear || '2030'),
      cvv: String(payload.cvv || payload.cardCvv || '123'),
      installments: Number(payload.installments || 1),
      feePercent: Number(payload.feePercent || 0),
    };
    if (payload.description) data.description = payload.description;
    if (payload.externalReference) data.externalReference = payload.externalReference;

    return this.request<GatewayCardPaymentResponse>(merchantId, {
      method: 'POST',
      url: '/payments/card',
      data,
    });
  }

  async getPayment(merchantId: string, paymentId: string): Promise<GatewayPixPaymentResponse | GatewayCardPaymentResponse> {
    return this.request(merchantId, {
      method: 'GET',
      url: `/payments/${paymentId}`,
    });
  }

  async getWallet(merchantId: string): Promise<GatewayWalletResponse> {
    return this.request<GatewayWalletResponse>(merchantId, {
      method: 'GET',
      url: '/wallet',
    });
  }

  async getWalletTransactions(
    merchantId: string,
    params?: {
      status?: string;
      type?: string;
      limit?: number;
    },
  ): Promise<GatewayTransactionItem[]> {
    return this.request<GatewayTransactionItem[]>(merchantId, {
      method: 'GET',
      url: '/wallet/transactions',
      params,
    });
  }

  async requestWithdrawal(merchantId: string, payload: GatewayWithdrawalRequest): Promise<GatewayWithdrawalResponse> {
    return this.request<GatewayWithdrawalResponse>(merchantId, {
      method: 'POST',
      url: '/withdrawals',
      data: payload,
    });
  }

  async getWithdrawal(merchantId: string, id: string): Promise<GatewayWithdrawalResponse> {
    return this.request<GatewayWithdrawalResponse>(merchantId, {
      method: 'GET',
      url: `/withdrawals/${id}`,
    });
  }
}
