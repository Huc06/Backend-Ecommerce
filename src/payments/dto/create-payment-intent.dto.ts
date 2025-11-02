import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  bankCode?: string; // Optional: specific bank code for VNPAY
}

