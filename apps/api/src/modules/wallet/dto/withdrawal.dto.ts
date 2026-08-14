import { IsNotEmpty, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export class CreateWithdrawalDto {
  @ApiProperty({ example: 5000, description: 'Amount to withdraw in cents (e.g. 5000 = R$ 50,00)' })
  @IsInt()
  @Min(100)
  amountCents: number;

  @ApiProperty({ enum: PixKeyType, example: PixKeyType.EMAIL })
  @IsEnum(PixKeyType)
  pixKeyType: PixKeyType;

  @ApiProperty({ example: 'merchant@pix.com', description: 'Destination Pix key' })
  @IsNotEmpty()
  @IsString()
  pixKey: string;
}
