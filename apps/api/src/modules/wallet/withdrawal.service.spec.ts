import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WalletService } from './wallet.service';
import { Withdrawal, WithdrawalStatus } from '../../database/entities';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';
import { PixKeyType } from './dto/withdrawal.dto';

describe('WithdrawalService', () => {
  let service: WithdrawalService;
  let mockWithdrawalRepo: Record<string, jest.Mock>;
  let mockGatewayClient: { requestWithdrawal: jest.Mock; getWithdrawal: jest.Mock };
  let mockWalletService: { getBalance: jest.Mock };

  beforeEach(async () => {
    mockWithdrawalRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'wth-uuid' })),
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockGatewayClient = {
      requestWithdrawal: jest.fn().mockResolvedValue({
        id: 'gw_wth_123',
        status: 'PENDING',
      }),
      getWithdrawal: jest.fn().mockResolvedValue({
        id: 'gw_wth_123',
        status: 'APPROVED',
      }),
    };

    mockWalletService = {
      getBalance: jest.fn().mockResolvedValue({
        balanceCents: 100000, // R$ 1.000,00
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalService,
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: mockWithdrawalRepo,
        },
        {
          provide: LeraBoxGatewayClient,
          useValue: mockGatewayClient,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    service = module.get<WithdrawalService>(WithdrawalService);
  });

  it('should request withdrawal successfully when sufficient funds', async () => {
    const withdrawal = await service.requestWithdrawal('merchant-uuid', {
      amountCents: 50000, // R$ 500,00
      pixKey: 'lojista@pix.com',
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(withdrawal.amountCents).toBe(50000);
    expect(withdrawal.pixKey).toBe('lojista@pix.com');
    expect(withdrawal.merchantId).toBe('merchant-uuid');
    expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);
    expect(mockWithdrawalRepo.save).toHaveBeenCalled();
  });

  it('should reject withdrawal when insufficient balance', async () => {
    mockWalletService.getBalance.mockResolvedValue({
      balanceCents: 1000, // R$ 10,00
    });

    await expect(
      service.requestWithdrawal('merchant-uuid', {
        amountCents: 50000,
        pixKey: 'lojista@pix.com',
        pixKeyType: PixKeyType.EMAIL,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
