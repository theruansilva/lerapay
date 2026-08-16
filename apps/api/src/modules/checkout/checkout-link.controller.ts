import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CheckoutLinkService } from './checkout-link.service';
import { CreateCheckoutLinkDto } from './dto/checkout.dto';

@ApiTags('Checkout')
@Controller('api/checkout/links')
export class CheckoutLinkController {
  constructor(private readonly linkService: CheckoutLinkService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new checkout link for merchant' })
  @ApiResponse({ status: 201, description: 'Checkout link created' })
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCheckoutLinkDto,
  ) {
    return this.linkService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all checkout links created by merchant' })
  @ApiResponse({ status: 200, description: 'List of merchant links' })
  async list(@Request() req: { user: { id: string } }) {
    return this.linkService.findByMerchant(req.user.id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get checkout link details by public slug' })
  @ApiResponse({ status: 200, description: 'Checkout link details' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async getBySlug(@Param('slug') slug: string) {
    const link = await this.linkService.findBySlug(slug);
    return {
      id: link.id,
      slug: link.slug,
      title: link.title,
      description: link.description,
      amountCents: link.amountCents,
      status: link.status,
      expiresAt: link.expiresAt,
      merchant: {
        id: link.merchant?.id,
        name: link.merchant?.name,
      },
    };
  }
}
