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

  it('should process PAYMENT_PIX CANCELLED and transition Order to CANCELLED & Link to CANCELLED', async () => {
    const order = {
      id: 'ord-cancelled-1',
      externalReference: 'ref-cancelled-123',
      status: OrderStatus.PENDING,
      checkoutLink: { id: 'link-cancelled-1', status: CheckoutLinkStatus.ACTIVE },
    };

    mockManager.findOne.mockResolvedValue(order);

    const event = {
      id: 'evt-cancelled',
      eventType: 'PAYMENT_PIX',
      externalReference: 'ref-cancelled-123',
      processed: false,
      payload: {
        event: 'PAYMENT_PIX',
        data: {
          externalReference: 'ref-cancelled-123',
          status: 'CANCELLED',
        },
      },
    } as unknown as WebhookEvent;

    const result = await service.processEvent(event);
    expect(result).toBe(true);
    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.checkoutLink.status).toBe(CheckoutLinkStatus.CANCELLED);
  });

  it('should preserve terminal state (APPROVED) and ignore late conflicting status updates', async () => {
    const order = {
      id: 'ord-terminal-1',
      externalReference: 'ref-terminal-123',
      status: OrderStatus.APPROVED,
      checkoutLink: { id: 'link-terminal-1', status: CheckoutLinkStatus.PAID },
    };

    mockManager.findOne.mockResolvedValue(order);

    const event = {
      id: 'evt-late',
      eventType: 'PAYMENT_PIX',
      externalReference: 'ref-terminal-123',
      processed: false,
      payload: {
        event: 'PAYMENT_PIX',
        data: {
          externalReference: 'ref-terminal-123',
          status: 'DENIED', // Late update attempting to deny an already approved order
        },
      },
    } as unknown as WebhookEvent;

    const result = await service.processEvent(event);
    expect(result).toBe(true);
    expect(order.status).toBe(OrderStatus.APPROVED); // Should remain APPROVED
    expect(order.checkoutLink.status).toBe(CheckoutLinkStatus.PAID); // Should remain PAID
  });
});
