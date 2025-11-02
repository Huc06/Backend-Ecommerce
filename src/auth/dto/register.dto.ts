import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'User password (min 6 characters)',
    minLength: 6 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'User full name' 
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ 
    example: 'buyer', 
    description: 'User role',
    enum: ['buyer', 'seller', 'admin'],
    required: false,
    default: 'buyer'
  })
  @IsOptional()
  @IsEnum(['buyer', 'seller', 'admin'])
  role?: string;
}

