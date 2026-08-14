import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutLinkDto {
  @ApiProperty({ example: 'Assinatura Plano Pro', description: 'Title or product description' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Acesso mensal a todas as ferramentas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4990, description: 'Amount in cents (e.g. 4990 = R$ 49,90)' })
  @IsInt()
  @Min(100) // minimum R$ 1,00
  amountCents: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  expiresAt?: string;
}

export class PixPaymentDto {
  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  payerDocument?: string;
}

export class CardPaymentDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsNotEmpty()
  @IsString()
  cardNumber: string;

  @ApiProperty({ example: 'JOAO DA SILVA' })
  @IsNotEmpty()
  @IsString()
  cardHolderName: string;

  @ApiProperty({ example: '12' })
  @IsNotEmpty()
  @IsString()
  cardExpirationMonth: string;

  @ApiProperty({ example: '28' })
  @IsNotEmpty()
  @IsString()
  cardExpirationYear: string;

  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @IsString()
  cardCvv: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  installments: number;

  @ApiProperty({ example: 2.99, description: 'Fee percent claimed from fee table' })
  @IsNotEmpty()
  feePercent: number;

  @ApiPropertyOptional({ example: 'Visa' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  payerDocument?: string;
}
