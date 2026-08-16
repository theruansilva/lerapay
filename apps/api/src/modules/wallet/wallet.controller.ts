import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';

@ApiTags('Wallet')
@Controller('api/wallet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly withdrawalService: WithdrawalService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant wallet balance in cents and formatted BRL' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get filtered financial statement transactions' })
  @ApiQuery({ name: 'status', required: false, enum: ['APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['PIX', 'CARD'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getStatement(
    @Request() req: any,
    @Query('status') status?: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED',
    @Query('type') type?: 'PIX' | 'CARD',
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getStatement(req.user.id, { status, type, limit });
  }

  @Post('withdrawals')
  @ApiOperation({ summary: 'Request a withdrawal via Pix' })
  @ApiResponse({ status: 201, description: 'Withdrawal requested successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient funds or invalid Pix key' })
  async requestWithdrawal(@Request() req: any, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalService.requestWithdrawal(req.user.id, dto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List all withdrawal requests' })
  @ApiResponse({ status: 200, description: 'List of withdrawals' })
  async listWithdrawals(@Request() req: any) {
    return this.withdrawalService.listWithdrawals(req.user.id);
  }

  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get status of specific withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal details' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  async getWithdrawal(@Request() req: any, @Param('id') id: string) {
    return this.withdrawalService.getWithdrawal(req.user.id, id);
  }
}
