import {
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export function IsValidPixKey(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPixKey',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const dto = args.object as Record<string, unknown>;
          const type = dto.pixKeyType;
          if (typeof value !== 'string') return false;

          switch (type) {
            case 'CPF':
              return /^[0-9]{11}$/.test(value);
            case 'CNPJ':
              return /^[0-9]{14}$/.test(value);
            case 'EMAIL':
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'PHONE':
              return /^[0-9]{10,11}$/.test(value);
            case 'RANDOM':
              return /^[a-zA-Z0-9-]{32,36}$/.test(value);
            default:
              return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as Record<string, unknown>;
          return `pixKey must be a valid format for key type ${dto.pixKeyType}`;
        }
      },
    });
  };
}

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
  @Max(100000000)
  amountCents: number;

  @ApiProperty({ enum: PixKeyType, example: PixKeyType.EMAIL })
  @IsEnum(PixKeyType)
  pixKeyType: PixKeyType;

  @ApiProperty({ example: 'merchant@pix.com', description: 'Destination Pix key' })
  @IsNotEmpty()
  @IsString()
  @IsValidPixKey()
  pixKey: string;
}

export class GetStatementQueryDto {
  @ApiPropertyOptional({ enum: ['APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'])
  status?: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';

  @ApiPropertyOptional({ enum: ['PIX', 'CARD'] })
  @IsOptional()
  @IsEnum(['PIX', 'CARD'])
  type?: 'PIX' | 'CARD';

  @ApiPropertyOptional({ example: 50, description: 'Pagination limit (1 to 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
