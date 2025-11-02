import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'Order UUID to create payment for' 
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ 
    example: 'VNBANK', 
    description: 'Optional bank code for VNPAY (VNBANK, VNPAYQR, INTCARD, etc.)',
    required: false
  })
  @IsOptional()
  @IsString()
  bankCode?: string;
}

