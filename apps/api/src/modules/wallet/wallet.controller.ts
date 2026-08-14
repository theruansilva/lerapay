import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('api/wallet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant wallet balance in cents and formatted BRL' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getBalance() {
    return this.walletService.getBalance();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get filtered financial statement transactions' })
  @ApiQuery({ name: 'status', required: false, enum: ['APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['PIX', 'CARD'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getStatement(
    @Query('status') status?: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED',
    @Query('type') type?: 'PIX' | 'CARD',
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getStatement({ status, type, limit });
  }
}
