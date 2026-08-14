import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeraBoxGatewayClient } from './gateway.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LeraBoxGatewayClient],
  exports: [LeraBoxGatewayClient],
})
export class GatewayModule {}
