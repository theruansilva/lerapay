import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { Order, OrderStatus } from '../../database/entities';

export interface WalletBalanceDto {
  balanceCents: number;
  formattedBrl: string;
  currency: string;
}

export interface StatementFilterQuery {
  status?: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
  type?: 'PIX' | 'CARD';
  limit?: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly gatewayClient: LeraBoxGatewayClient,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async getBalance(): Promise<WalletBalanceDto> {
    try {
      const gwWallet = await this.gatewayClient.getWallet();
      const balanceCents = Number(gwWallet.balance || 0);

      return {
        balanceCents,
        formattedBrl: (balanceCents / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        currency: gwWallet.currency || 'BRL',
      };
    } catch (error) {
      this.logger.warn(`Could not fetch balance from live gateway: ${error}. Aggregating local approved orders.`);
      // Fallback: calculate balance from approved orders
      const orders = await this.orderRepo.find({
        where: { status: OrderStatus.APPROVED },
      });
      const balanceCents = orders.reduce((sum, ord) => sum + ord.amountCents, 0);

      return {
        balanceCents,
        formattedBrl: (balanceCents / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        currency: 'BRL',
      };
    }
  }

  async getStatement(filter: StatementFilterQuery) {
    const query = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.checkoutLink', 'link')
      .orderBy('order.createdAt', 'DESC');

    if (filter.status) {
      query.andWhere('order.status = :status', { status: filter.status });
    }

    if (filter.type) {
      query.andWhere('order.paymentMethod = :type', { type: filter.type });
    }

    if (filter.limit) {
      query.take(filter.limit);
    } else {
      query.take(50);
    }

    const orders = await query.getMany();

    return orders.map((order) => ({
      id: order.id,
      externalReference: order.externalReference,
      gatewayPaymentId: order.gatewayPaymentId,
      paymentMethod: order.paymentMethod,
      amountCents: order.amountCents,
      formattedAmount: (order.amountCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      feePercent: order.feePercent,
      installments: order.installments,
      status: order.status,
      title: order.checkoutLink?.title || 'Pagamento Direto',
      payerName: order.payerName,
      payerEmail: order.payerEmail,
      createdAt: order.createdAt,
    }));
  }
}
