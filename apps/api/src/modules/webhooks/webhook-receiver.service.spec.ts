import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhookReceiverService } from './webhook-receiver.service';
import { WebhookEvent } from '../../database/entities';

describe('WebhookReceiverService', () => {
  let service: WebhookReceiverService;
  let mockEventRepo: Record<string, jest.Mock>;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockEventRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'event-uuid' })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GATEWAY_WEBHOOK_SECRET') return 'my_secret_key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookReceiverService,
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: mockEventRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhookReceiverService>(WebhookReceiverService);
  });

  it('should record event with valid signature', async () => {
    const payload = {
      event: 'PAYMENT_PIX',
      data: {
        id: 'gw_123',
        externalReference: 'ord_123',
        status: 'APPROVED',
      },
    };

    const payloadString = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac('sha256', 'my_secret_key')
      .update(payloadString)
      .digest('hex');

    const event = await service.recordEvent(payload, validSignature);
    expect(event.eventType).toBe('PAYMENT_PIX');
    expect(event.externalReference).toBe('ord_123');
    expect(event.processed).toBe(false);
  });

  it('should reject webhook with invalid signature', async () => {
    const payload = {
      event: 'PAYMENT_PIX',
      data: { status: 'APPROVED' },
    };

    await expect(
      service.recordEvent(payload, 'invalid_signature_hash'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
