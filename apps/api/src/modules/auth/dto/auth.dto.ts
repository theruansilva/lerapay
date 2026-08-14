import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'merchant@lerapay.com', description: 'Merchant email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Empresa Demo Ltda', description: 'Merchant or store name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '12345678000199', description: 'CPF or CNPJ' })
  @IsOptional()
  @IsString()
  document?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'merchant@lerapay.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsNotEmpty()
  password: string;
}
