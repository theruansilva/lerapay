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
import { CreateWithdrawalDto, GetStatementQueryDto } from './dto/withdrawal.dto';

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
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async getStatement(
    @Request() req: any,
    @Query() query: GetStatementQueryDto,
  ) {
    return this.walletService.getStatement(req.user.id, query);
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
