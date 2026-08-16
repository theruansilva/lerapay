import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { LeraBoxGatewayClient } from '../gateway/gateway.client';

class GatewayRegisterDto {
  @ApiProperty({ example: 'Empresa Demo Ltda', description: 'Full name or company name' })
  @IsNotEmpty() @IsString()
  name: string;

  @ApiProperty({ example: 'merchant@exemplo.com', description: 'Valid e-mail (gateway will contact you)' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '11999990000', description: 'Valid phone number (digits only)' })
  @IsNotEmpty() @IsString()
  phone: string;

  @ApiProperty({ example: '12345678000199', description: 'CPF (11 digits) or CNPJ (14 digits)' })
  @IsNotEmpty() @IsString()
  document: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsNotEmpty() @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: ['PF', 'PJ'], default: 'PJ' })
  @IsOptional() @IsEnum(['PF', 'PJ'])
  type?: 'PF' | 'PJ';
}

class GatewayLinkDto {
  @ApiProperty({ example: '12345678000199', description: 'CPF or CNPJ used on the gateway account' })
  @IsNotEmpty() @IsString()
  document: string;

  @ApiProperty({ example: 'SenhaForte@123', description: 'Password of the gateway account' })
  @IsNotEmpty() @IsString()
  gatewayPassword: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly gatewayClient: LeraBoxGatewayClient,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new merchant user' })
  @ApiResponse({ status: 201, description: 'Merchant registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate merchant and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated merchant profile' })
  @ApiResponse({ status: 200, description: 'Current profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('gateway/register')
  @ApiOperation({
    summary: 'Register a new account on the Lera Box gateway (POST /users)',
    description:
      'Calls the public gateway endpoint to create an account. ' +
      'Gateway sends document, password, CodigoCliente and ChaveLoja to the provided e-mail. ' +
      'After receiving the e-mail, use POST /api/auth/gateway/link to bind the credentials.',
  })
  @ApiResponse({ status: 201, description: 'Registration submitted — gateway will send credentials by e-mail' })
  async registerOnGateway(@Body() dto: GatewayRegisterDto) {
    const result = await this.gatewayClient.registerGatewayUser({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      document: dto.document,
      password: dto.password,
      type: dto.type ?? 'PJ',
    });
    return { message: result.message ?? 'Registration submitted. Check your e-mail for credentials.' };
  }

  @Post('gateway/link')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link existing Lera Box gateway credentials to this merchant account',
    description:
      'Persists the gateway document + password, immediately authenticates and stores the Bearer token. ' +
      'Run this after receiving credentials by e-mail from the gateway.',
  })
  @ApiResponse({ status: 200, description: 'Gateway credentials linked and authenticated' })
  @ApiResponse({ status: 502, description: 'Gateway authentication failed — check credentials' })
  @HttpCode(HttpStatus.OK)
  async linkGatewayCredentials(
    @Request() req: { user: { id: string } },
    @Body() dto: GatewayLinkDto,
  ) {
    await this.gatewayClient.linkGatewayCredentials(req.user.id, dto);
    const profile = await this.authService.getProfile(req.user.id);
    return { message: 'Gateway credentials linked successfully', profile };
  }
}
