import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, Withdrawal } from '../../database/entities';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';
import { WalletController } from './wallet.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Withdrawal]),
    GatewayModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, WithdrawalService],
  exports: [WalletService, WithdrawalService],
})
export class WalletModule {}
