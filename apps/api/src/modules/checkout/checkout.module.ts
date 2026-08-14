import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLink, Order, User } from '../../database/entities';
import { CheckoutLinkService } from './checkout-link.service';
import { PixPaymentService } from './pix-payment.service';
import { CheckoutController } from './checkout.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutLink, Order, User]),
    GatewayModule,
    FeesModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutLinkService, PixPaymentService],
  exports: [CheckoutLinkService, PixPaymentService],
})
export class CheckoutModule {}
