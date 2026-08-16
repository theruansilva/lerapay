import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PixPaymentService } from './pix-payment.service';
import { CheckoutLink, Order, CheckoutLinkStatus, OrderStatus, PaymentMethod } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

describe('PixPaymentService', () => {
  let service: PixPaymentService;
  let mockLinkRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockGatewayClient: { createPixPayment: jest.Mock };

  beforeEach(async () => {
    mockLinkRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    mockOrderRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'order-uuid' })),
      save: jest.fn().mockImplementation((order) => Promise.resolve(order)),
      findOne: jest.fn(),
    };

    const mockEntityManager = {
      findOne: jest.fn().mockImplementation((entity, criteria) => {
        if (entity === CheckoutLink) {
          return mockLinkRepo.findOne(criteria);
        }
        if (entity === Order) {
          return mockOrderRepo.findOne(criteria);
        }
        return null;
      }),
      save: jest.fn().mockImplementation((entity, val) => {
        if (entity === CheckoutLink) {
          return mockLinkRepo.save(val);
        }
        return mockOrderRepo.save(val);
      }),
      create: jest.fn().mockImplementation((entity, dto) => mockOrderRepo.create(dto)),
    };

    mockLinkRepo.manager.transaction.mockImplementation((cb) => cb(mockEntityManager));

    mockGatewayClient = {
      createPixPayment: jest.fn().mockResolvedValue({
        id: 'gw_pix_123',
        txid: 'tx_abc',
        status: 'PENDING',
        qrCodeBase64: 'base64_qr',
        emv: '0002012658...',
        amount: 5000,
        externalReference: 'ord_123',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PixPaymentService,
        {
          provide: getRepositoryToken(CheckoutLink),
          useValue: mockLinkRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: LeraBoxGatewayClient,
          useValue: mockGatewayClient,
        },
      ],
    }).compile();

    service = module.get<PixPaymentService>(PixPaymentService);
  });

  it('should process Pix payment and return Order with QR code & EMV', async () => {
    mockLinkRepo.findOne.mockResolvedValue({
      id: 'link-1',
      slug: 'chk_pix',
      amountCents: 5000,
      status: CheckoutLinkStatus.ACTIVE,
      merchantId: 'm1',
    });

    const order = await service.processPixPayment('chk_pix', {
      payerName: 'Maria Silva',
      payerEmail: 'maria@email.com',
    });

    expect(order.paymentMethod).toBe(PaymentMethod.PIX);
    expect(order.amountCents).toBe(5000);
    expect(order.pixQrCodeBase64).toBeDefined();
    expect(order.pixEmv).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  it('should reject payment if checkout link is already PAID', async () => {
    mockLinkRepo.findOne.mockResolvedValue({
      id: 'link-1',
      slug: 'chk_paid',
      amountCents: 5000,
      status: CheckoutLinkStatus.PAID,
      merchantId: 'm1',
    });

    await expect(
      service.processPixPayment('chk_paid', {}),
    ).rejects.toThrow(BadRequestException);
  });
});
