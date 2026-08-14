import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LeraBoxGatewayClient } from './gateway.client';

describe('LeraBoxGatewayClient', () => {
  let client: LeraBoxGatewayClient;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'GATEWAY_API_URL') return 'https://api.branchpay.com.br/api';
        if (key === 'GATEWAY_EMAIL') return 'test@lerapay.com';
        if (key === 'GATEWAY_PASSWORD') return 'secret123';
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeraBoxGatewayClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<LeraBoxGatewayClient>(LeraBoxGatewayClient);
  });

  it('should instantiate and return token on authenticate', async () => {
    // In test / simulation environment fallback
    const token = await client.authenticate();
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
