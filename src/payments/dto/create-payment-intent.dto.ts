import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

