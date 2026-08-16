import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhookReceiverService } from './webhook-receiver.service';
import { WebhookEvent } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

describe('WebhookReceiverService', () => {
  let client: WebhookReceiverService;
  let mockEventRepo: Record<string, jest.Mock>;
  let mockConfigService: { get: jest.Mock };
  let mockGatewayClient: { registerWebhook: jest.Mock };

  beforeEach(async () => {
    mockEventRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'event-uuid' })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      findOne: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GATEWAY_WEBHOOK_SECRET') return 'my_secret_key';
        return undefined;
      }),
    };

    mockGatewayClient = {
      registerWebhook: jest.fn().mockResolvedValue({ registered: true }),
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
        {
          provide: LeraBoxGatewayClient,
          useValue: mockGatewayClient,
        },
      ],
    }).compile();

    client = module.get<WebhookReceiverService>(WebhookReceiverService);
  });
  it('should record event with valid signature as raw body Buffer', async () => {
    const payload = {
      event: 'PAYMENT_PIX',
      data: {
        id: 'gw_123',
        externalReference: 'ord_123',
        status: 'APPROVED',
      },
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    const validSignature = crypto
      .createHmac('sha256', 'my_secret_key')
      .update(payloadBuffer)
      .digest('hex');

    const event = await client.recordEvent(payload, payloadBuffer, validSignature);
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
      client.recordEvent(payload, undefined, 'invalid_signature_hash'),
    ).rejects.toThrow(UnauthorizedException);
    expect(mockEventRepo.create).not.toHaveBeenCalled();
  });

  it('should reject malformed payload with BadRequestException', async () => {
    const malformedPayload = {
      event: '', // empty event
      data: null,
    } as any;

    await expect(
      client.recordEvent(malformedPayload, undefined, undefined),
    ).rejects.toThrow(BadRequestException);
    expect(mockEventRepo.create).not.toHaveBeenCalled();
  });

  it('should return existing event if DB unique constraint violation occurs', async () => {
    const payload = {
      event: 'PAYMENT_PIX',
      data: {
        id: 'gw_123',
        externalReference: 'ord_123',
        status: 'APPROVED',
      },
    };

    const mockExistingEvent = {
      id: 'existing-uuid',
      deduplicationKey: 'PAYMENT_PIX:gw_123:APPROVED',
      eventType: 'PAYMENT_PIX',
      externalReference: 'ord_123',
      processed: true,
    };

    mockEventRepo.save.mockRejectedValueOnce({
      code: 'ER_DUP_ENTRY',
      message: 'Duplicate entry for key UQ_deduplicationKey',
    });
    mockEventRepo.findOne.mockResolvedValue(mockExistingEvent);

    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    const validSignature = crypto
      .createHmac('sha256', 'my_secret_key')
      .update(payloadBuffer)
      .digest('hex');

    const result = await client.recordEvent(payload, payloadBuffer, validSignature);
    expect(result).toEqual(mockExistingEvent);
  });

  it('should register all three mandated event types via registerAllWebhooks', async () => {
    const result = await client.registerAllWebhooks('merchant-123', 'https://example.com/callback');
    expect(result).toHaveProperty('success', true);
    expect(mockGatewayClient.registerWebhook).toHaveBeenCalledTimes(3);
    expect(mockGatewayClient.registerWebhook).toHaveBeenNthCalledWith(
      1,
      'merchant-123',
      { url: 'https://example.com/callback', event: 'PAYMENT_PIX' },
    );
    expect(mockGatewayClient.registerWebhook).toHaveBeenNthCalledWith(
      2,
      'merchant-123',
      { url: 'https://example.com/callback', event: 'PAYMENT_CARD' },
    );
    expect(mockGatewayClient.registerWebhook).toHaveBeenNthCalledWith(
      3,
      'merchant-123',
      { url: 'https://example.com/callback', event: 'WITHDRAWAL' },
    );
  });
});
