import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CardPaymentService } from './card-payment.service';
import { CheckoutLink, Order, CheckoutLinkStatus, OrderStatus, PaymentMethod } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { FeesService } from '../fees/fees.service';

describe('CardPaymentService', () => {
  let service: CardPaymentService;
  let mockLinkRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockGatewayClient: { createCardPayment: jest.Mock };
  let mockFeesService: { validateInstallmentFee: jest.Mock };

  beforeEach(async () => {
    mockLinkRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    mockOrderRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'order-uuid-card' })),
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
      createCardPayment: jest.fn().mockResolvedValue({
        id: 'gw_card_123',
        status: 'APPROVED',
        amount: 10000,
        installments: 2,
        feePercent: 3.49,
        externalReference: 'ord_card_123',
      }),
    };

    mockFeesService = {
      validateInstallmentFee: jest.fn().mockResolvedValue(3.49),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardPaymentService,
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
        {
          provide: FeesService,
          useValue: mockFeesService,
        },
      ],
    }).compile();

    service = module.get<CardPaymentService>(CardPaymentService);
  });

  it('should process Card payment with valid fee and return APPROVED order', async () => {
    mockLinkRepo.findOne.mockResolvedValue({
      id: 'link-card',
      slug: 'chk_card',
      amountCents: 10000,
      status: CheckoutLinkStatus.ACTIVE,
      merchantId: 'm1',
    });

    const order = await service.processCardPayment('chk_card', {
      cardNumber: '4111111111111111',
      cardHolderName: 'Carlos Silva',
      cardExpirationMonth: '12',
      cardExpirationYear: '28',
      cardCvv: '123',
      installments: 2,
      feePercent: 3.49,
      brand: 'Visa',
    });

    expect(order.paymentMethod).toBe(PaymentMethod.CARD);
    expect(order.feePercent).toBe(3.49);
    expect(order.installments).toBe(2);
    expect(order.cardLast4).toBe('1111');
    expect(order.status).toBe(OrderStatus.APPROVED);
  });

  it('should reject payment if fee validation fails', async () => {
    mockLinkRepo.findOne.mockResolvedValue({
      id: 'link-card',
      slug: 'chk_card',
      amountCents: 10000,
      status: CheckoutLinkStatus.ACTIVE,
      merchantId: 'm1',
    });

    mockFeesService.validateInstallmentFee.mockRejectedValue(
      new BadRequestException('Fee percent mismatch'),
    );

    await expect(
      service.processCardPayment('chk_card', {
        cardNumber: '4111111111111111',
        cardHolderName: 'Carlos Silva',
        cardExpirationMonth: '12',
        cardExpirationYear: '28',
        cardCvv: '123',
        installments: 2,
        feePercent: 1.0,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
