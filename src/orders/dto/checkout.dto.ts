import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Shipping address',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  shippingAddress: string;

  @ApiProperty({
    example: 'Please deliver before 5 PM',
    description: 'Additional notes for the order',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'SUMMER2025',
    description: 'Voucher code to apply discount',
    required: false,
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}

