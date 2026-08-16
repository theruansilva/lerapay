import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeraBoxGatewayClient } from './gateway.client';
import { User } from '../../database/entities';
describe('LeraBoxGatewayClient', () => {
  let client: LeraBoxGatewayClient;
  let mockConfigService: { get: jest.Mock };
  let mockUserRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'GATEWAY_API_URL') return 'https://api.branchpay.com.br/api';
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };

    mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'merchant-123',
        document: '12345678901',
        gatewayPassword: 'secretpassword',
        gatewayToken: 'existing-token',
        gatewayTokenExpiresAt: Date.now() + 100000,
      }),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeraBoxGatewayClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    client = module.get<LeraBoxGatewayClient>(LeraBoxGatewayClient);
  });

  it('should return cached token if not expired', async () => {
    mockUserRepo.findOneBy.mockResolvedValueOnce({
      id: 'merchant-123',
      document: '12345678901',
      gatewayPassword: 'secretpassword',
      gatewayToken: 'existing-mock-token',
      gatewayTokenExpiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
    const token = await client.getToken('merchant-123');
    expect(token).toBe('existing-mock-token');
  });

  it('should authenticate with gateway using document and password to get new token', async () => {
    mockUserRepo.findOneBy.mockResolvedValue({
      id: 'merchant-123',
      document: '12345678901',
      gatewayPassword: 'secretpassword',
      gatewayToken: null,
      gatewayTokenExpiresAt: null,
    });

    jest.spyOn((client as any).http, 'post').mockResolvedValueOnce({
      data: {
        access_token: 'new-gateway-token-abc',
        codigoCliente: '123456',
        chaveLoja: 'storekey-xyz',
      },
    });

    const token = await client.authenticate('merchant-123');
    expect(token).toBe('new-gateway-token-abc');
    expect(mockUserRepo.save).toHaveBeenCalled();
  });

  it('should return gateway fees list when gateway call is successful', async () => {
    jest.spyOn((client as any).http, 'get').mockResolvedValueOnce({
      data: [
        { installments: 1, feePercent: 2.99, brand: 'Visa' },
        { installments: 2, feePercent: 3.49, brand: 'Visa' },
      ],
    });
    const fees = await client.getFees('Visa');
    expect(fees).toBeDefined();
    expect(fees).toHaveLength(2);
    expect(fees[0].installments).toBe(1);
    expect(fees[0].feePercent).toBe(2.99);
  });

  it('should propagate error when gateway call fails', async () => {
    jest.spyOn((client as any).http, 'get').mockRejectedValueOnce(new Error('Network Error'));
    await expect(client.getFees('Visa')).rejects.toThrow();
  });

  it('should format requestWithdrawal payload with sanitized document and omit pixKeyType', async () => {
    const requestSpy = jest.spyOn((client as any).http, 'request').mockResolvedValueOnce({
      data: {
        id: 'wth-123',
        amount: 5000,
        status: 'PENDING',
        pixKey: '12345678901',
        createdAt: '2026-08-16T00:00:00Z',
      },
    });

    const res = await client.requestWithdrawal('merchant-123', {
      amount: 5000,
      pixKey: '12345678901',
      pixKeyType: 'CPF',
    });

    expect(res.id).toBe('wth-123');
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/withdrawals',
        data: {
          amount: 5000,
          pixKey: '12345678901',
          document: '12345678901',
        },
      }),
    );
  });
});
