import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly config: ConfigService) {
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

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.tokenExpiresAt > now + 60000) {
      return this.token;
    }

    return this.authenticate();
  }

  async authenticate(): Promise<string> {
    const email = this.config.get<string>('GATEWAY_EMAIL');
    const password = this.config.get<string>('GATEWAY_PASSWORD');

    if (!email || !password) {
      this.logger.warn('GATEWAY_EMAIL or GATEWAY_PASSWORD not configured. Using simulated dev token.');
      this.token = 'simulated-bearer-token-lera-box';
      this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      return this.token;
    }

    try {
      this.logger.log(`Authenticating with Gateway at ${this.http.defaults.baseURL}/auth/login for ${email}`);
      const response = await this.http.post<GatewayLoginResponse>('/auth/login', {
        email,
        password,
      });

      this.token = response.data.token;
      this.tokenExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
      this.logger.log('Successfully authenticated with Gateway');
      return this.token;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gateway auth failed';
      this.logger.error(`Gateway authentication failed: ${message}`);
      if (this.config.get('NODE_ENV') !== 'production') {
        this.logger.warn('Falling back to sandbox simulation token.');
        this.token = 'sandbox-simulated-token';
        this.tokenExpiresAt = Date.now() + 60 * 60 * 1000;
        return this.token;
      }
      throw new HttpException('Gateway authentication failed', HttpStatus.BAD_GATEWAY);
    }
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const token = await this.getToken();
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
        this.logger.warn('Received 401 from Gateway, refreshing token and retrying...');
        const refreshedToken = await this.authenticate();
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
      this.logger.error(`Gateway request error on ${config.url}: ${errMsg}`);
      throw new HttpException(
        `Gateway error: ${errMsg}`,
        axios.isAxiosError(error) && error.response?.status ? error.response.status : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getProfile(): Promise<GatewayUserMeResponse> {
    return this.request<GatewayUserMeResponse>({
      method: 'GET',
      url: '/users/me',
    });
  }

  async getFees(brand?: string): Promise<GatewayFeeItem[]> {
    try {
      const response = await this.http.get<GatewayFeeItem[]>('/fees', {
        params: brand ? { brand } : undefined,
      });
      if (Array.isArray(response.data)) {
        return response.data;
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

  async createPixPayment(payload: GatewayPixPaymentRequest): Promise<GatewayPixPaymentResponse> {
    return this.request<GatewayPixPaymentResponse>({
      method: 'POST',
      url: '/payments/pix',
      data: payload,
    });
  }

  async createCardPayment(payload: GatewayCardPaymentRequest): Promise<GatewayCardPaymentResponse> {
    return this.request<GatewayCardPaymentResponse>({
      method: 'POST',
      url: '/payments/card',
      data: payload,
    });
  }

  async getPayment(paymentId: string): Promise<GatewayPixPaymentResponse | GatewayCardPaymentResponse> {
    return this.request({
      method: 'GET',
      url: `/payments/${paymentId}`,
    });
  }

  async getWallet(): Promise<GatewayWalletResponse> {
    return this.request<GatewayWalletResponse>({
      method: 'GET',
      url: '/wallet',
    });
  }

  async getWalletTransactions(params?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<GatewayTransactionItem[]> {
    return this.request<GatewayTransactionItem[]>({
      method: 'GET',
      url: '/wallet/transactions',
      params,
    });
  }

  async requestWithdrawal(payload: GatewayWithdrawalRequest): Promise<GatewayWithdrawalResponse> {
    return this.request<GatewayWithdrawalResponse>({
      method: 'POST',
      url: '/withdrawals',
      data: payload,
    });
  }

  async getWithdrawal(id: string): Promise<GatewayWithdrawalResponse> {
    return this.request<GatewayWithdrawalResponse>({
      method: 'GET',
      url: `/withdrawals/${id}`,
    });
  }
}
