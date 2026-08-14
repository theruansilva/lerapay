import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CheckoutLink, CheckoutLinkStatus, User } from '../../database/entities';
import { CreateCheckoutLinkDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutLinkService {
  constructor(
    @InjectRepository(CheckoutLink)
    private readonly linkRepo: Repository<CheckoutLink>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(merchantId: string, dto: CreateCheckoutLinkDto): Promise<CheckoutLink> {
    const merchant = await this.userRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const slug = `chk_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

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
}
