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
import { PixPaymentService } from './pix-payment.service';
import { CardPaymentService } from './card-payment.service';
import { CreateCheckoutLinkDto, PixPaymentDto, CardPaymentDto } from './dto/checkout.dto';

@ApiTags('Checkout')
@Controller('api/checkout')
export class CheckoutController {
  constructor(
    private readonly linkService: CheckoutLinkService,
    private readonly pixPaymentService: PixPaymentService,
    private readonly cardPaymentService: CardPaymentService,
  ) {}

  @Post('links')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new checkout link for merchant' })
  @ApiResponse({ status: 201, description: 'Checkout link created' })
  async createLink(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCheckoutLinkDto,
  ) {
    return this.linkService.create(req.user.id, dto);
  }

  @Get('links')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all checkout links created by merchant' })
  @ApiResponse({ status: 200, description: 'List of merchant links' })
  async listLinks(@Request() req: { user: { id: string } }) {
    return this.linkService.findByMerchant(req.user.id);
  }

  @Get('links/:slug')
  @ApiOperation({ summary: 'Get checkout link details by public slug' })
  @ApiResponse({ status: 200, description: 'Checkout link details' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async getLinkBySlug(@Param('slug') slug: string) {
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

  @Post('pay/:slug/pix')
  @ApiOperation({ summary: 'Generate Pix QR Code and EMV for checkout link' })
  @ApiResponse({ status: 201, description: 'Pix order generated with QR Code' })
  async payPix(
    @Param('slug') slug: string,
    @Body() dto: PixPaymentDto,
  ) {
    const order = await this.pixPaymentService.processPixPayment(slug, dto);
    return {
      id: order.id,
      externalReference: order.externalReference,
      paymentMethod: order.paymentMethod,
      amountCents: order.amountCents,
      status: order.status,
      pixQrCodeBase64: order.pixQrCodeBase64,
      pixEmv: order.pixEmv,
      pixTxid: order.pixTxid,
      createdAt: order.createdAt,
    };
  }

  @Post('pay/:slug/card')
  @ApiOperation({ summary: 'Process Credit Card payment for checkout link' })
  @ApiResponse({ status: 201, description: 'Card order processed' })
  async payCard(
    @Param('slug') slug: string,
    @Body() dto: CardPaymentDto,
  ) {
    const order = await this.cardPaymentService.processCardPayment(slug, dto);
    return {
      id: order.id,
      externalReference: order.externalReference,
      paymentMethod: order.paymentMethod,
      amountCents: order.amountCents,
      status: order.status,
      cardBrand: order.cardBrand,
      cardLast4: order.cardLast4,
      createdAt: order.createdAt,
    };
  }

  @Get('orders/:externalReference')
  @ApiOperation({ summary: 'Check status of order by externalReference' })
  @ApiResponse({ status: 200, description: 'Current order status' })
  async getOrder(@Param('externalReference') externalReference: string) {
    const order = await this.pixPaymentService.getOrderByExternalReference(externalReference);
    return {
      id: order.id,
      externalReference: order.externalReference,
      paymentMethod: order.paymentMethod,
      amountCents: order.amountCents,
      status: order.status,
      pixQrCodeBase64: order.pixQrCodeBase64,
      pixEmv: order.pixEmv,
      pixTxid: order.pixTxid,
      cardBrand: order.cardBrand,
      cardLast4: order.cardLast4,
      createdAt: order.createdAt,
    };
  }
}
