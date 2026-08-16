import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CheckoutLink,
  CheckoutLinkStatus,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { FeesService } from '../fees/fees.service';
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
  ) {}

  async processCardPayment(slug: string, dto: CardPaymentDto): Promise<Order> {
    const link = await this.linkRepo.findOne({ where: { slug } });
    if (!link) {
      throw new NotFoundException(`Checkout link ${slug} not found`);
    }

    if (link.status === CheckoutLinkStatus.PAID) {
      throw new BadRequestException('Checkout link has already been paid');
    }

    if (link.status === CheckoutLinkStatus.EXPIRED || (link.expiresAt && new Date() > new Date(link.expiresAt))) {
      link.status = CheckoutLinkStatus.EXPIRED;
      await this.linkRepo.save(link);
      throw new BadRequestException('Checkout link has expired');
    }

    const brand = dto.brand || 'Visa';
    // Validate that the submitted feePercent matches exactly the fee table rate from the gateway
    const verifiedFeePercent = await this.feesService.validateInstallmentFee(
      dto.installments,
      dto.feePercent,
      brand,
    );

    const externalReference = `ord_${uuidv4().replace(/-/g, '')}`;
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
      await this.linkRepo.save(link);
    } else if (gatewayResponse.status === 'DENIED') {
      orderStatus = OrderStatus.DENIED;
    }

    const order = this.orderRepo.create({
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
    return this.orderRepo.save(order);
  }
}
