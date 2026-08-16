import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FeesService } from './fees.service';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

@ApiTags('Fees')
@Controller('api/fees')
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly gatewayClient: LeraBoxGatewayClient,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get installment fee table from Gateway' })
  @ApiQuery({ name: 'brand', required: false, example: 'Visa' })
  @ApiResponse({ status: 200, description: 'Fee items returned successfully' })
  async getFees(@Query('brand') brand?: string) {
    return this.feesService.getFeesForBrand(brand);
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate installment plan for a specific amount in cents' })
  @ApiQuery({ name: 'amountCents', required: true, example: 10000 })
  @ApiQuery({ name: 'brand', required: false, example: 'Visa' })
  @ApiResponse({ status: 200, description: 'Installments calculated with rates and totals' })
  async calculate(
    @Query('amountCents') amountCents: number,
    @Query('brand') brand?: string,
  ) {
    return this.feesService.calculateInstallments(Number(amountCents), brand || 'Visa');
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check connection and profile status on Lera Box Gateway' })
  @ApiResponse({ status: 200, description: 'Gateway connection profile' })
  async getGatewayStatus(@Request() req: any) {
    try {
      const profile = await this.gatewayClient.getProfile(req.user.id);
      return {
        connected: true,
        profile,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Gateway unreachable',
      };
    }
  }
}
