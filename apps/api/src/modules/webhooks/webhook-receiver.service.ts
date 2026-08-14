import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhookEvent } from '../../database/entities';

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
  ) {}

  verifySignature(rawBody: string | object, signatureHeader?: string): boolean {
    const secret = this.config.get<string>('GATEWAY_WEBHOOK_SECRET');
    if (!secret) {
      return true;
    }

    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Lera-Box-Signature header');
    }

    const payloadString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
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
    signatureHeader?: string,
  ): Promise<WebhookEvent> {
    this.verifySignature(payload, signatureHeader);

    const eventType = payload.event || 'UNKNOWN';
    const externalReference = payload.data?.externalReference || undefined;

    this.logger.log(
      `Received webhook event: ${eventType}, externalReference: ${externalReference}`,
    );

    const event = this.webhookEventRepo.create({
      eventType,
      externalReference,
      payload: payload as unknown as Record<string, unknown>,
      processed: false,
    });

    return this.webhookEventRepo.save(event);
  }
}
