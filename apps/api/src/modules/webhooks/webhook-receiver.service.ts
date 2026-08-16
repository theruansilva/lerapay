import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhookEvent } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

export interface WebhookPayload {
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL' | string;
  data: {
    id?: string;
    externalReference?: string;
    status: 'APPROVED' | 'DENIED' | 'PENDING' | 'EXPIRED' | 'CANCELLED' | string;
    amount?: number;
    [key: string]: unknown;
  };
}

@Injectable()
export class WebhookReceiverService {
  private readonly logger = new Logger(WebhookReceiverService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
    private readonly config: ConfigService,
    private readonly gatewayClient: LeraBoxGatewayClient,
  ) {}

  verifySignature(rawBody: string | Buffer | object, signatureHeader?: string): boolean {
    const secret = this.config.get<string>('GATEWAY_WEBHOOK_SECRET');
    if (!secret) {
      return true;
    }

    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Lera-Box-Signature header');
    }

    let payloadBuffer: Buffer;
    if (Buffer.isBuffer(rawBody)) {
      payloadBuffer = rawBody;
    } else if (typeof rawBody === 'string') {
      payloadBuffer = Buffer.from(rawBody);
    } else {
      payloadBuffer = Buffer.from(JSON.stringify(rawBody));
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');

    const sigBuf = Buffer.from(signatureHeader);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid X-Lera-Box-Signature');
    }

    return true;
  }

  async recordEvent(
    payload: WebhookPayload,
    rawBody?: Buffer | string,
    signatureHeader?: string,
  ): Promise<WebhookEvent> {
    // Validate payload shape
    if (!payload || typeof payload !== 'object' || !payload.event || !payload.data) {
      throw new BadRequestException('Malformed webhook payload');
    }

    this.verifySignature(rawBody || payload, signatureHeader);

    const eventType = payload.event || 'UNKNOWN';
    const externalReference = payload.data?.externalReference || undefined;

    this.logger.log(
      `Received webhook event: ${eventType}, externalReference: ${externalReference}`,
    );

    const eventId = payload.data?.id || payload.data?.externalReference || crypto.randomUUID();
    const status = payload.data?.status || 'UNKNOWN';
    const deduplicationKey = `${eventType}:${eventId}:${status}`;

    const event = this.webhookEventRepo.create({
      deduplicationKey,
      eventType,
      externalReference,
      payload: payload as unknown as Record<string, unknown>,
      processed: false,
    });

    try {
      return await this.webhookEventRepo.save(event);
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const error = err as Record<string, unknown>;
        const code = error.code;
        const message = error.message;
        if (
          code === 'ER_DUP_ENTRY' ||
          (typeof message === 'string' && (
            message.includes('duplicate') ||
            message.includes('Duplicate') ||
            message.includes('unique') ||
            message.includes('Unique')
          ))
        ) {
          this.logger.warn(`Duplicate webhook event ignored: ${deduplicationKey}`);
          const existing = await this.webhookEventRepo.findOne({
            where: { deduplicationKey },
          });
          if (existing) {
            return existing;
          }
        }
      }
      throw err;
    }
  }

  async registerAllWebhooks(merchantId: string, url: string): Promise<unknown> {
    if (!url) {
      throw new BadRequestException('Webhook URL is required');
    }
    const events = ['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'];
    const results = [];
    for (const event of events) {
      try {
        const res = await this.gatewayClient.registerWebhook(merchantId, { url, event });
        results.push({ event, status: 'success', data: res });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to register webhook for event ${event}: ${message}`);
        results.push({ event, status: 'failed', error: message });
      }
    }
    return { success: true, results };
  }
}
