import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsDateString,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty({
    example: 'SUMMER2025',
    description: 'Unique voucher code (uppercase recommended)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    example: 'Summer sale 2025 - 20% off',
    description: 'Voucher description',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    enum: ['percentage', 'fixed'],
    example: 'percentage',
    description: 'Discount type: percentage or fixed amount',
  })
  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @ApiProperty({
    example: 20,
    description: 'Discount value (percentage: 1-100, fixed: any positive number)',
  })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({
    example: 100000,
    description: 'Minimum order value to apply voucher',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({
    example: 50000,
    description: 'Maximum discount amount (for percentage type)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({
    example: 100,
    description: 'Usage limit (0 = unlimited)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @ApiProperty({
    example: '2025-06-01T00:00:00.000Z',
    description: 'Voucher start date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    example: '2025-12-31T23:59:59.999Z',
    description: 'Voucher expiry date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

