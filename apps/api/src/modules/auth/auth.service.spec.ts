import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../database/entities';
describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: Record<string, jest.Mock>;
  let mockJwtService: { sign: jest.Mock };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'user-uuid-1' })),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user successfully', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    const result = await service.register({
      email: 'novo@merchant.com',
      password: 'password123',
      name: 'Novo Merchant',
    });

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('novo@merchant.com');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should throw ConflictException if user already exists', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: '1', email: 'existing@merchant.com' });

    await expect(
      service.register({
        email: 'existing@merchant.com',
        password: 'password123',
        name: 'Existing',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should login valid user successfully', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    mockUserRepository.findOne.mockResolvedValue({
      id: 'u1',
      email: 'login@merchant.com',
      name: 'Login Merchant',
      passwordHash,
    });

    const result = await service.login({
      email: 'login@merchant.com',
      password: 'secret123',
    });

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('login@merchant.com');
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    mockUserRepository.findOne.mockResolvedValue({
      id: 'u1',
      email: 'login@merchant.com',
      passwordHash,
    });

    await expect(
      service.login({
        email: 'login@merchant.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
