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
            // Disable FK checks per-connection so TypeORM ALTER TABLE
            // doesn't hit child-row violations on MySQL 8 during sync.
            // afterCreate runs once per new pool connection before it's used.
            pool: {
              afterCreate: (conn: { query: (sql: string, cb: (err: Error | null) => void) => void }, done: (err: Error | null, conn: unknown) => void) => {
                conn.query('SET FOREIGN_KEY_CHECKS=0', (err) => done(err, conn));
              },
            },
          },
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
