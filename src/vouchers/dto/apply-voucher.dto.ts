import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyVoucherDto {
  @ApiProperty({
    example: 'SUMMER2025',
    description: 'Voucher code to apply',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

