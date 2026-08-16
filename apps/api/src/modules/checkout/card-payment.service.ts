import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  CheckoutLink,
  CheckoutLinkStatus,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { FeesService } from '../fees/fees.service';
import { CheckoutLinkService } from './checkout-link.service';
import { CardPaymentDto } from './dto/checkout.dto';

@Injectable()
export class CardPaymentService {
  private readonly logger = new Logger(CardPaymentService.name);

  constructor(
    @InjectRepository(CheckoutLink)
    private readonly linkRepo: Repository<CheckoutLink>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly gatewayClient: LeraBoxGatewayClient,
    private readonly feesService: FeesService,
  ) { }

  async processCardPayment(slug: string, dto: CardPaymentDto): Promise<Order> {
    return this.linkRepo.manager.transaction(async (transactionalEntityManager) => {
      const link = await CheckoutLinkService.validateAndLockLink(transactionalEntityManager, slug);
      const brand = dto.brand || 'Visa';
      // Validate that the submitted feePercent matches exactly the fee table rate from the gateway
      const verifiedFeePercent = await this.feesService.validateInstallmentFee(
        dto.installments,
        dto.feePercent,
        brand,
      );

      const externalReference = `ord_${randomUUID().replace(/-/g, '')}`;
      const cardLast4 = dto.cardNumber.slice(-4);

      this.logger.log(
        `Processing Card payment for link ${slug}, externalReference: ${externalReference}, installments: ${dto.installments}, feePercent: ${verifiedFeePercent}%`,
      );

      const gatewayResponse = await this.gatewayClient.createCardPayment(link.merchantId, {
        amount: link.amountCents,
        externalReference,
        cardNumber: dto.cardNumber,
        cardHolderName: dto.cardHolderName,
        cardExpirationMonth: dto.cardExpirationMonth,
        cardExpirationYear: dto.cardExpirationYear,
        cardCvv: dto.cardCvv,
        installments: dto.installments,
        feePercent: verifiedFeePercent,
        brand,
      });

      const gatewayPaymentId = gatewayResponse.id;
      let orderStatus: OrderStatus = OrderStatus.PENDING;
      if (gatewayResponse.status === 'APPROVED') {
        orderStatus = OrderStatus.APPROVED;
        link.status = CheckoutLinkStatus.PAID;
        await transactionalEntityManager.save(link);
      } else if (gatewayResponse.status === 'DENIED') {
        orderStatus = OrderStatus.DENIED;
      }

      const order = transactionalEntityManager.create(Order, {
        merchantId: link.merchantId,
        externalReference,
        gatewayPaymentId,
        paymentMethod: PaymentMethod.CARD,
        amountCents: link.amountCents,
        feePercent: verifiedFeePercent,
        installments: dto.installments,
        status: orderStatus,
        cardBrand: brand,
        cardLast4,
        payerName: dto.cardHolderName,
        payerEmail: dto.payerEmail,
        payerDocument: dto.payerDocument,
        checkoutLinkId: link.id,
      });

      return transactionalEntityManager.save(Order, order);
    });
  }
}
