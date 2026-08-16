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

  it('should instantiate and return token on authenticate', async () => {
    mockUserRepo.findOneBy.mockResolvedValueOnce({
      id: 'merchant-123',
      document: '12345678901',
      gatewayPassword: 'secretpassword',
      gatewayToken: null,
      gatewayTokenExpiresAt: null,
    });
    // In test environment, mock the client authenticate or let it throw if no internet,
    // but we can mock finding the user with a token to avoid real HTTP requests in tests
    const token = await client.getToken('merchant-123');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should return default fees list when gateway call falls back', async () => {
    const fees = await client.getFees('Visa');
    expect(fees).toBeDefined();
    expect(Array.isArray(fees)).toBe(true);
    expect(fees.length).toBeGreaterThan(0);
    expect(fees[0].installments).toBe(1);
  });
});
