import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { Order } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

describe('WalletService', () => {
  let service: WalletService;
  let mockGatewayClient: { getWallet: jest.Mock };
  let mockOrderRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockGatewayClient = {
      getWallet: jest.fn().mockResolvedValue({
        balance: 150000,
        currency: 'BRL',
      }),
    };

    mockOrderRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'ord-1',
            externalReference: 'ext-1',
            paymentMethod: 'PIX',
            amountCents: 5000,
            status: 'APPROVED',
            feePercent: 0,
            installments: 1,
            createdAt: new Date(),
          },
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: LeraBoxGatewayClient,
          useValue: mockGatewayClient,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should return balance from gateway client in cents and formatted BRL', async () => {
    const result = await service.getBalance('merchant-123');
    expect(result.balanceCents).toBe(150000);
    expect(result.formattedBrl).toContain('1.500,00');
  });

  it('should return statement transactions with filters', async () => {
    const items = await service.getStatement('merchant-123', { status: 'APPROVED' });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('APPROVED');
    expect(items[0].amountCents).toBe(5000);
  });
});
