import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal, WithdrawalStatus } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { WalletService } from './wallet.service';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    private readonly gatewayClient: LeraBoxGatewayClient,
    private readonly walletService: WalletService,
  ) {}

  async requestWithdrawal(merchantId: string, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const { balanceCents } = await this.walletService.getBalance(merchantId);
    if (balanceCents < dto.amountCents) {
      throw new BadRequestException(
        `Insufficient funds. Available balance: R$ ${(balanceCents / 100).toFixed(2)}, requested: R$ ${(dto.amountCents / 100).toFixed(2)}`,
      );
    }

    this.logger.log(`Requesting withdrawal of ${dto.amountCents} cents to ${dto.pixKey} for merchant ${merchantId}`);

    const response = await this.gatewayClient.requestWithdrawal(merchantId, {
      amount: dto.amountCents,
      pixKey: dto.pixKey,
      pixKeyType: dto.pixKeyType,
    });

    gatewayWithdrawalId = response.id;
    status = (response.status as WithdrawalStatus) || WithdrawalStatus.PENDING;
    const withdrawal = this.withdrawalRepo.create({
      merchantId,
      amountCents: dto.amountCents,
      pixKey: dto.pixKey,
      pixKeyType: dto.pixKeyType,
      gatewayWithdrawalId,
      status,
    });

    return this.withdrawalRepo.save(withdrawal);
  }

  async listWithdrawals(merchantId: string): Promise<Withdrawal[]> {
    return this.withdrawalRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getWithdrawal(merchantId: string, id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id, merchantId } });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${id} not found`);
    }

    if (withdrawal.gatewayWithdrawalId && withdrawal.status === WithdrawalStatus.PENDING) {
      try {
        const gwRes = await this.gatewayClient.getWithdrawal(merchantId, withdrawal.gatewayWithdrawalId);
        if (gwRes.status && gwRes.status !== withdrawal.status) {
          withdrawal.status = gwRes.status as WithdrawalStatus;
          await this.withdrawalRepo.save(withdrawal);
        }
      } catch (error) {
        this.logger.warn(`Failed to poll status for withdrawal ${id} for merchant ${merchantId}: ${error}`);
      }
    }

    return withdrawal;
  }
}
