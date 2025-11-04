import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt: ${registerDto.email}`);

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Email already exists: ${registerDto.email}`);
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
    });

    await this.userRepository.save(user);

    this.logger.log(`User registered successfully: ${user.email}`);

    // Send welcome email (async, don't wait)
    this.emailService.sendWelcomeEmail(user.email, user.fullName).catch((error) => {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
    });

    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${loginDto.email}`);

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      this.logger.warn(`User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      this.logger.warn(`Inactive user login attempt: ${loginDto.email}`);
      throw new UnauthorizedException('Account is not active');
    }

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    const token = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${user.email}`);

    // Return user info and token
    const { password, ...userInfo } = user;
    return {
      user: userInfo,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update fullName if provided
    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }

    // Update password if provided
    if (updateProfileDto.currentPassword && updateProfileDto.newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(updateProfileDto.newPassword, 10);
    }

    await this.userRepository.save(user);
    const { password, ...result } = user;
    return result;
  }
}

