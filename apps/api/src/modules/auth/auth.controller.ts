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
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
