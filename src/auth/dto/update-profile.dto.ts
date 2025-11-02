import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ 
    example: 'Jane Doe', 
    description: 'Updated full name',
    required: false,
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  fullName?: string;

  @ApiProperty({ 
    example: 'oldpassword123', 
    description: 'Current password (required if changing password)',
    required: false,
    minLength: 6,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  currentPassword?: string;

  @ApiProperty({ 
    example: 'newpassword456', 
    description: 'New password',
    required: false,
    minLength: 6,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword?: string;
}