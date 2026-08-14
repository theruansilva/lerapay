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
    return this.linkService.findBySlug(slug);
  }

  @Post('pay/:slug/pix')
  @ApiOperation({ summary: 'Generate Pix QR Code and EMV for checkout link' })
  @ApiResponse({ status: 201, description: 'Pix order generated with QR Code' })
  async payPix(
    @Param('slug') slug: string,
    @Body() dto: PixPaymentDto,
  ) {
    return this.pixPaymentService.processPixPayment(slug, dto);
  }

  @Post('pay/:slug/card')
  @ApiOperation({ summary: 'Process Credit Card payment for checkout link' })
  @ApiResponse({ status: 201, description: 'Card order processed' })
  async payCard(
    @Param('slug') slug: string,
    @Body() dto: CardPaymentDto,
  ) {
    return this.cardPaymentService.processCardPayment(slug, dto);
  }

  @Get('orders/:externalReference')
  @ApiOperation({ summary: 'Check status of order by externalReference' })
  @ApiResponse({ status: 200, description: 'Current order status' })
  async getOrder(@Param('externalReference') externalReference: string) {
    return this.pixPaymentService.getOrderByExternalReference(externalReference);
  }
}
