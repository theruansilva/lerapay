import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  CheckoutLink,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { CheckoutLinkService } from './checkout-link.service';
import { PixPaymentDto } from './dto/checkout.dto';

@Injectable()
export class PixPaymentService {
  private readonly logger = new Logger(PixPaymentService.name);

  constructor(
    @InjectRepository(CheckoutLink)
    private readonly linkRepo: Repository<CheckoutLink>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly gatewayClient: LeraBoxGatewayClient,
  ) { }

  async processPixPayment(slug: string, dto: PixPaymentDto): Promise<Order> {
    return this.linkRepo.manager.transaction(async (transactionalEntityManager) => {
      const link = await CheckoutLinkService.validateAndLockLink(transactionalEntityManager, slug);
      const externalReference = `ord_${randomUUID().replace(/-/g, '')}`;
      this.logger.log(`Processing Pix payment for link ${slug}, externalReference: ${externalReference}`);

      const gatewayResponse = await this.gatewayClient.createPixPayment(link.merchantId, {
        amount: link.amountCents,
        externalReference,
        payerDocument: dto.payerDocument || '51145071848',
        description: link.description || `Pagamento link ${link.slug}`,
      });

      const qrCodeBase64 = gatewayResponse.metadata?.qrCodeBase64 || gatewayResponse.qrCodeBase64;
      const emv = gatewayResponse.metadata?.emv || gatewayResponse.emv;
      const txid = gatewayResponse.metadata?.txid || gatewayResponse.txid || gatewayResponse.id;

      const order = transactionalEntityManager.create(Order, {
        merchantId: link.merchantId,
        externalReference,
        gatewayPaymentId: gatewayResponse.id,
        paymentMethod: PaymentMethod.PIX,
        amountCents: link.amountCents,
        feePercent: 0,
        installments: 1,
        status: OrderStatus.PENDING,
        pixQrCodeBase64: qrCodeBase64,
        pixEmv: emv,
        pixTxid: txid,
        payerName: dto.payerName,
        payerEmail: dto.payerEmail,
        payerDocument: dto.payerDocument,
        checkoutLinkId: link.id,
      });

      return transactionalEntityManager.save(Order, order);
    });
  }

  async getOrderByExternalReference(externalReference: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { externalReference },
      relations: ['checkoutLink'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${externalReference} not found`);
    }

    return order;
  }
}
