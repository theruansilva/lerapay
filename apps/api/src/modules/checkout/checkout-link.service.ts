import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { CheckoutLink, CheckoutLinkStatus, Order, OrderStatus, User } from '../../database/entities';
import { CreateCheckoutLinkDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutLinkService {
  constructor(
    @InjectRepository(CheckoutLink)
    private readonly linkRepo: Repository<CheckoutLink>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async create(merchantId: string, dto: CreateCheckoutLinkDto): Promise<CheckoutLink> {
    const merchant = await this.userRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const slug = `chk_${randomUUID().replace(/-/g, '').substring(0, 12)}`;

    const link = this.linkRepo.create({
      slug,
      title: dto.title,
      description: dto.description,
      amountCents: dto.amountCents,
      status: CheckoutLinkStatus.ACTIVE,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      merchantId,
    });

    return this.linkRepo.save(link);
  }

  async findByMerchant(merchantId: string): Promise<CheckoutLink[]> {
    return this.linkRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<CheckoutLink> {
    const link = await this.linkRepo.findOne({
      where: { slug },
      relations: ['merchant'],
    });

    if (!link) {
      throw new NotFoundException(`Checkout link with slug ${slug} not found`);
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      if (link.status === CheckoutLinkStatus.ACTIVE) {
        link.status = CheckoutLinkStatus.EXPIRED;
        await this.linkRepo.save(link);
      }
    }

    return link;
  }

  static async validateAndLockLink(
    manager: EntityManager,
    slug: string,
  ): Promise<CheckoutLink> {
    const link = await manager.findOne(CheckoutLink, {
      where: { slug },
      lock: { mode: 'pessimistic_write' },
    });
    if (!link) {
      throw new NotFoundException(`Checkout link ${slug} not found`);
    }

    if (link.status === CheckoutLinkStatus.PAID) {
      throw new BadRequestException('Checkout link has already been paid');
    }

    if (link.status === CheckoutLinkStatus.EXPIRED || (link.expiresAt && new Date() > new Date(link.expiresAt))) {
      link.status = CheckoutLinkStatus.EXPIRED;
      await manager.save(link);
      throw new BadRequestException('Checkout link has expired');
    }

    const existingPending = await manager.findOne(Order, {
      where: { checkoutLinkId: link.id, status: OrderStatus.PENDING },
    });
    if (existingPending) {
      throw new BadRequestException('Payment initiation already in progress for this link');
    }

    return link;
  }
}
