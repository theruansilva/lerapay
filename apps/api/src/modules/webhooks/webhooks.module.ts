import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WebhookEvent,
  Order,
  CheckoutLink,
  Withdrawal,
} from '../../database/entities';
import { WebhookReceiverService } from './webhook-receiver.service';
import { WebhookProcessorService } from './webhook-processor.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookEvent,
      Order,
      CheckoutLink,
      Withdrawal,
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhookReceiverService, WebhookProcessorService],
  exports: [WebhookReceiverService, WebhookProcessorService],
})
export class WebhooksModule {}
