import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLink, Order, User } from '../../database/entities';
import { CheckoutLinkService } from './checkout-link.service';
import { CheckoutLinkController } from './checkout-link.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutLink, Order, User]),
    GatewayModule,
    FeesModule,
  ],
  controllers: [CheckoutLinkController],
  providers: [CheckoutLinkService],
  exports: [CheckoutLinkService],
})
export class CheckoutModule {}
