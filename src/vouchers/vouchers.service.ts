import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Check if code already exists
    const existing = await this.voucherRepository.findOne({
      where: { code: createVoucherDto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException('Voucher code already exists');
    }

    // Validate percentage discount value
    if (
      createVoucherDto.discountType === 'percentage' &&
      (createVoucherDto.discountValue < 0 ||
        createVoucherDto.discountValue > 100)
    ) {
      throw new BadRequestException('Percentage discount must be between 0 and 100');
    }

    // Create voucher
    const voucher = this.voucherRepository.create({
      ...createVoucherDto,
      code: createVoucherDto.code.toUpperCase(),
      usedCount: 0,
    });

    return this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return voucher;
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return voucher;
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);

    // Check if new code conflicts with existing voucher
    if (updateVoucherDto.code) {
      const existing = await this.voucherRepository.findOne({
        where: { code: updateVoucherDto.code.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Voucher code already exists');
      }
      updateVoucherDto.code = updateVoucherDto.code.toUpperCase();
    }

    // Validate percentage discount value
    if (
      updateVoucherDto.discountType === 'percentage' &&
      updateVoucherDto.discountValue !== undefined &&
      (updateVoucherDto.discountValue < 0 ||
        updateVoucherDto.discountValue > 100)
    ) {
      throw new BadRequestException('Percentage discount must be between 0 and 100');
    }

    Object.assign(voucher, updateVoucherDto);
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepository.remove(voucher);
  }

  /**
   * Validate voucher and calculate discount amount
   */
  async validateAndCalculateDiscount(
    code: string,
    orderTotal: number,
  ): Promise<{ voucher: Voucher; discountAmount: number }> {
    const voucher = await this.findByCode(code);

    // Check if voucher is active
    if (voucher.status !== 'active') {
      throw new BadRequestException('Voucher is not active');
    }

    // Check start date
    if (voucher.startDate && new Date() < new Date(voucher.startDate)) {
      throw new BadRequestException('Voucher is not yet valid');
    }

    // Check expiry date
    if (voucher.expiryDate && new Date() > new Date(voucher.expiryDate)) {
      throw new BadRequestException('Voucher has expired');
    }

    // Check usage limit
    if (
      voucher.usageLimit > 0 &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      throw new BadRequestException('Voucher usage limit reached');
    }

    // Check minimum order value
    if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value is ${voucher.minOrderValue}`,
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (orderTotal * voucher.discountValue) / 100;
      // Apply max discount limit
      if (
        voucher.maxDiscountAmount &&
        discountAmount > voucher.maxDiscountAmount
      ) {
        discountAmount = voucher.maxDiscountAmount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Ensure discount doesn't exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return { voucher, discountAmount };
  }

  /**
   * Increment usage count after successful order
   */
  async incrementUsage(voucherId: string): Promise<void> {
    await this.voucherRepository.increment({ id: voucherId }, 'usedCount', 1);
  }
}

