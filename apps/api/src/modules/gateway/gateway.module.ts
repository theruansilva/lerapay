import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities';
import { LeraBoxGatewayClient } from './gateway.client';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [LeraBoxGatewayClient],
  exports: [LeraBoxGatewayClient],
})
export class GatewayModule {}
