import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WebhookEvent,
  Order,
  OrderStatus,
  CheckoutLink,
  CheckoutLinkStatus,
  Withdrawal,
  WithdrawalStatus,
} from '../../database/entities';

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly eventRepo: Repository<WebhookEvent>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(CheckoutLink)
    private readonly linkRepo: Repository<CheckoutLink>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    private readonly dataSource: DataSource,
  ) { }

  async processEvent(event: WebhookEvent): Promise<boolean> {
    if (event.processed) {
      this.logger.warn(`Event ${event.id} already processed. Skipping (idempotency).`);
      return true;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payload = event.payload;
      const eventType = event.eventType;
      const data = payload?.data || {};
      const externalReference = data.externalReference || event.externalReference;
      const slug = data.slug || payload?.slug;
      const status = data.status || payload?.status;

      this.logger.log(`Processing event ${event.id} of type ${eventType} for ref ${externalReference || slug}`);

      if (eventType === 'PAYMENT_PIX' || eventType === 'PAYMENT_CARD') {
        let order = externalReference
          ? await queryRunner.manager.findOne(Order, {
            where: { externalReference },
            relations: ['checkoutLink'],
          })
          : null;

        if (!order && slug) {
          const link = await queryRunner.manager.findOne(CheckoutLink, {
            where: { slug },
          });
          if (link) {
            order = await queryRunner.manager.findOne(Order, {
              where: { checkoutLinkId: link.id },
              order: { createdAt: 'DESC' },
              relations: ['checkoutLink'],
            });
          }
        }
        if (order) {
          const isTerminal = [
            OrderStatus.APPROVED,
            OrderStatus.DENIED,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
          ].includes(order.status as OrderStatus);

          if (!isTerminal) {
            if (status === 'APPROVED') {
              order.status = OrderStatus.APPROVED;
              if (order.checkoutLink) {
                order.checkoutLink.status = CheckoutLinkStatus.PAID;
                await queryRunner.manager.save(CheckoutLink, order.checkoutLink);
              }
            } else if (status === 'DENIED') {
              order.status = OrderStatus.DENIED;
            } else if (status === 'EXPIRED') {
              order.status = OrderStatus.EXPIRED;
            } else if (status === 'CANCELLED') {
              order.status = OrderStatus.CANCELLED;
              if (order.checkoutLink) {
                order.checkoutLink.status = CheckoutLinkStatus.CANCELLED;
                await queryRunner.manager.save(CheckoutLink, order.checkoutLink);
              }
            }
            await queryRunner.manager.save(Order, order);
          } else {
            this.logger.warn(`Order ${order.id} is already in terminal state ${order.status}. Ignoring late status update to ${status}.`);
          }
        }
      } else if (eventType === 'WITHDRAWAL') {
        const withdrawalId = data.id;
        if (withdrawalId) {
          const withdrawal = await queryRunner.manager.findOne(Withdrawal, {
            where: { gatewayWithdrawalId: String(withdrawalId) },
          });

          if (withdrawal) {
            const isTerminal = [
              WithdrawalStatus.APPROVED,
              WithdrawalStatus.DENIED,
            ].includes(withdrawal.status as WithdrawalStatus);

            if (!isTerminal) {
              if (status === 'APPROVED') {
                withdrawal.status = WithdrawalStatus.APPROVED;
              } else if (status === 'DENIED') {
                withdrawal.status = WithdrawalStatus.DENIED;
              }
              await queryRunner.manager.save(Withdrawal, withdrawal);
            } else {
              this.logger.warn(`Withdrawal ${withdrawal.id} is already in terminal state ${withdrawal.status}. Ignoring late status update to ${status}.`);
            }
          }
        }
      }
      event.processed = true;
      event.processingError = null;
      await queryRunner.manager.save(WebhookEvent, event);

      await queryRunner.commitTransaction();
      this.logger.log(`Event ${event.id} processed successfully`);
      return true;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(`Error processing webhook event ${event.id}: ${errorMsg}`);
      event.processed = false;
      event.processingError = errorMsg;
      await this.eventRepo.save(event);
      return false;
    } finally {
      await queryRunner.release();
    }
  }
}
