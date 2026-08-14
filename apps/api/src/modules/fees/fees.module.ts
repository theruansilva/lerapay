import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
