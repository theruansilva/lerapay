import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Lera Pay - BaaS API')
    .setDescription('Banking as a Service API integrated with Lera Box / BranchPay Gateway')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Merchant registration and authentication')
    .addTag('Checkout', 'Checkout links, Pix and Card payment processing')
    .addTag('Wallet', 'Wallet balance and filtered statement')
    .addTag('Withdrawals', 'Withdrawal requests and status tracking')
    .addTag('Fees', 'Gateway fee lookup and calculations')
    .addTag('Webhooks', 'Gateway callback reception and idempotency')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`BaaS API running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
