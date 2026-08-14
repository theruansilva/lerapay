import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FeesService } from './fees.service';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

describe('FeesService', () => {
  let service: FeesService;
  let mockGatewayClient: { getFees: jest.Mock };

  beforeEach(async () => {
    mockGatewayClient = {
      getFees: jest.fn().mockResolvedValue([
        { installments: 1, feePercent: 2.99, brand: 'Visa' },
        { installments: 2, feePercent: 3.49, brand: 'Visa' },
        { installments: 3, feePercent: 3.99, brand: 'Visa' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: LeraBoxGatewayClient,
          useValue: mockGatewayClient,
        },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  it('should calculate installments table correctly', async () => {
    const amountCents = 10000; // R$ 100,00
    const result = await service.calculateInstallments(amountCents, 'Visa');

    expect(result).toHaveLength(3);
    expect(result[0].installments).toBe(1);
    expect(result[0].feePercent).toBe(2.99);
    expect(result[0].feeAmountCents).toBe(299);
    expect(result[0].totalAmountCents).toBe(10299);
  });

  it('should validate matching installment fee successfully', async () => {
    const rate = await service.validateInstallmentFee(2, 3.49, 'Visa');
    expect(rate).toBe(3.49);
  });

  it('should reject mismatched installment fee percent', async () => {
    await expect(service.validateInstallmentFee(2, 1.99, 'Visa')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject invalid installment count', async () => {
    await expect(service.validateInstallmentFee(10, 5.0, 'Visa')).rejects.toThrow(
      BadRequestException,
    );
  });
});
