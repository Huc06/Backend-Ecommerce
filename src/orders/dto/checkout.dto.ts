import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  shippingAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

