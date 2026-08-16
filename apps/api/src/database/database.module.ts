import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  CheckoutLink,
  Order,
  Withdrawal,
  WebhookEvent,
} from './entities';

export const ENTITIES = [
  User,
  CheckoutLink,
  Order,
  Withdrawal,
  WebhookEvent,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 3306),
          username: config.get<string>('DB_USERNAME', 'root'),
          password: config.get<string>('DB_PASSWORD', 'root'),
          database: config.get<string>('DB_NAME', 'lerapay_baas'),
          entities: ENTITIES,
          synchronize: true,
          logging: isDev,
          extra: {
            decimalNumbers: true,
          },
        };
      },
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
