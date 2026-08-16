import {
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  IsEmail,
  Matches,
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
  @Max(100000000) // maximum R$ 1,000,000.00
  amountCents: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class PixPaymentDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsNotEmpty()
  @IsString()
  payerName: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsNotEmpty()
  @IsEmail()
  payerEmail: string;

  @ApiProperty({ example: '12345678901' })
  @IsNotEmpty()
  @Matches(/^[0-9]{11}$|^[0-9]{14}$/, { message: 'payerDocument must be a valid CPF (11 digits) or CNPJ (14 digits)' })
  payerDocument: string;
}

export class CardPaymentDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsNotEmpty()
  @Matches(/^[0-9]{13,19}$/, { message: 'cardNumber must be a string of 13 to 19 digits' })
  cardNumber: string;

  @ApiProperty({ example: 'JOAO DA SILVA' })
  @IsNotEmpty()
  @IsString()
  cardHolderName: string;

  @ApiProperty({ example: '12' })
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'cardExpirationMonth must be a string between 01 and 12' })
  cardExpirationMonth: string;

  @ApiProperty({ example: '28' })
  @IsNotEmpty()
  @Matches(/^([0-9]{2}|[0-9]{4})$/, { message: 'cardExpirationYear must be 2 or 4 digits' })
  cardExpirationYear: string;

  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @Matches(/^[0-9]{3,4}$/, { message: 'cardCvv must be 3 or 4 digits' })
  cardCvv: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Max(21)
  installments: number;

  @ApiProperty({ example: 2.99, description: 'Fee percent claimed from fee table' })
  @IsNotEmpty()
  feePercent: number;

  @ApiPropertyOptional({ example: 'Visa' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsNotEmpty()
  @IsEmail()
  payerEmail: string;

  @ApiProperty({ example: '12345678901' })
  @IsNotEmpty()
  @Matches(/^[0-9]{11}$|^[0-9]{14}$/, { message: 'payerDocument must be a valid CPF (11 digits) or CNPJ (14 digits)' })
  payerDocument: string;
}
