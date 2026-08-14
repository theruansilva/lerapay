import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { WebhookProcessorService } from './webhook-processor.service';
import {
  WebhookEvent,
  Order,
  OrderStatus,
  CheckoutLink,
  CheckoutLinkStatus,
  Withdrawal,
} from '../../database/entities';

describe('WebhookProcessorService', () => {
  let service: WebhookProcessorService;
  let mockEventRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockLinkRepo: Record<string, jest.Mock>;
  let mockWithdrawalRepo: Record<string, jest.Mock>;
  let mockDataSource: { createQueryRunner: jest.Mock };
  let mockManager: { findOne: jest.Mock; save: jest.Mock };
  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { findOne: jest.Mock; save: jest.Mock };
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((_entity, obj) => Promise.resolve(obj)),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    mockEventRepo = {
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    mockOrderRepo = {};
    mockLinkRepo = {};
    mockWithdrawalRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessorService,
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: mockEventRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(CheckoutLink),
          useValue: mockLinkRepo,
        },
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: mockWithdrawalRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WebhookProcessorService>(WebhookProcessorService);
  });

  it('should process PAYMENT_PIX APPROVED and transition Order to APPROVED & Link to PAID', async () => {
    const order = {
      id: 'ord-1',
      externalReference: 'ref-123',
      status: OrderStatus.PENDING,
      checkoutLink: { id: 'link-1', status: CheckoutLinkStatus.ACTIVE },
    };

    mockManager.findOne.mockResolvedValue(order);

    const event = {
      id: 'evt-1',
      eventType: 'PAYMENT_PIX',
      externalReference: 'ref-123',
      processed: false,
      payload: {
        event: 'PAYMENT_PIX',
        data: {
          externalReference: 'ref-123',
          status: 'APPROVED',
        },
      },
    } as unknown as WebhookEvent;

    const result = await service.processEvent(event);
    expect(result).toBe(true);
    expect(order.status).toBe(OrderStatus.APPROVED);
    expect(order.checkoutLink.status).toBe(CheckoutLinkStatus.PAID);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('should skip already processed event (idempotency)', async () => {
    const event = {
      id: 'evt-2',
      processed: true,
    } as unknown as WebhookEvent;

    const result = await service.processEvent(event);
    expect(result).toBe(true);
    expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
  });
});
