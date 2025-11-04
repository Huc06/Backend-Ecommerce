import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive', 'blocked'],
    example: 'blocked',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'inactive', 'blocked'])
  status: string;
}

