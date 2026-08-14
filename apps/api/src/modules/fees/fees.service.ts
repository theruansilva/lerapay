import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { GatewayFeeItem } from '../gateway/gateway.types';

export interface InstallmentCalculation {
  installments: number;
  feePercent: number;
  installmentAmountCents: number;
  totalAmountCents: number;
  feeAmountCents: number;
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private feeCache: Map<string, { items: GatewayFeeItem[]; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly gatewayClient: LeraBoxGatewayClient) {}

  async getFeesForBrand(brand?: string): Promise<GatewayFeeItem[]> {
    const key = (brand || 'DEFAULT').toUpperCase();
    const cached = this.feeCache.get(key);
    const now = Date.now();

    if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.items;
    }

    try {
      const items = await this.gatewayClient.getFees(brand);
      this.feeCache.set(key, { items, cachedAt: now });
      return items;
    } catch (error) {
      this.logger.error(`Failed to fetch fees for brand ${brand}: ${error}`);
      if (cached) return cached.items;
      throw error;
    }
  }

  async calculateInstallments(
    amountCents: number,
    brand: string = 'Visa',
  ): Promise<InstallmentCalculation[]> {
    const feeTable = await this.getFeesForBrand(brand);

    return feeTable.map((fee) => {
      // Fee amount = amountCents * (feePercent / 100)
      const feeAmountCents = Math.round(amountCents * (fee.feePercent / 100));
      const totalAmountCents = amountCents + feeAmountCents;
      const installmentAmountCents = Math.round(totalAmountCents / fee.installments);

      return {
        installments: fee.installments,
        feePercent: Number(fee.feePercent),
        installmentAmountCents,
        totalAmountCents,
        feeAmountCents,
      };
    });
  }

  async validateInstallmentFee(
    installments: number,
    claimedFeePercent: number,
    brand: string = 'Visa',
  ): Promise<number> {
    const feeTable = await this.getFeesForBrand(brand);
    const matched = feeTable.find((f) => f.installments === Number(installments));

    if (!matched) {
      throw new BadRequestException(
        `Installments count ${installments} is not allowed for brand ${brand}`,
      );
    }

    const expectedRate = Number(matched.feePercent);
    const diff = Math.abs(expectedRate - Number(claimedFeePercent));

    if (diff > 0.01) {
      throw new BadRequestException(
        `Fee percent mismatch for ${installments}x on ${brand}. Expected ${expectedRate}%, got ${claimedFeePercent}%`,
      );
    }

    return expectedRate;
  }
}
