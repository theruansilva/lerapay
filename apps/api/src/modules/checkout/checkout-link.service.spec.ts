import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CheckoutLinkService } from './checkout-link.service';
import { CheckoutLink, User, CheckoutLinkStatus } from '../../database/entities';

describe('CheckoutLinkService', () => {
  let service: CheckoutLinkService;
  let mockLinkRepo: Record<string, jest.Mock>;
  let mockUserRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockLinkRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'link-uuid' })),
      save: jest.fn().mockImplementation((link) => Promise.resolve(link)),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutLinkService,
        {
          provide: getRepositoryToken(CheckoutLink),
          useValue: mockLinkRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<CheckoutLinkService>(CheckoutLinkService);
  });

  it('should create a checkout link successfully', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'm1', name: 'Merchant' });

    const link = await service.create('m1', {
      title: 'Plano Anual',
      amountCents: 12000,
    });

    expect(link.slug).toBeDefined();
    expect(link.slug.startsWith('chk_')).toBe(true);
    expect(link.amountCents).toBe(12000);
    expect(link.status).toBe(CheckoutLinkStatus.ACTIVE);
  });

  it('should throw NotFoundException if merchant does not exist', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create('invalid-m', {
        title: 'Teste',
        amountCents: 1000,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should find link by slug', async () => {
    mockLinkRepo.findOne.mockResolvedValue({
      id: 'l1',
      slug: 'chk_test',
      status: CheckoutLinkStatus.ACTIVE,
    });

    const link = await service.findBySlug('chk_test');
    expect(link.slug).toBe('chk_test');
  });
});
