import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['buyer', 'seller', 'admin'],
    example: 'seller',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['buyer', 'seller', 'admin'])
  role: string;
}

