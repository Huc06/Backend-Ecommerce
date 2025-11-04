import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Mã voucher (VD: SUMMER2025, NEWYEAR50)

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  })
  discountType: 'percentage' | 'fixed'; // Giảm theo % hoặc số tiền

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number; // 10 (10%) hoặc 50000 (50k VNĐ)

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderValue: number; // Giá trị đơn hàng tối thiểu

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number; // Giảm tối đa (cho percentage type)

  @Column({ type: 'int', default: 0 })
  usageLimit: number; // Số lần sử dụng tối đa (0 = unlimited)

  @Column({ type: 'int', default: 0 })
  usedCount: number; // Số lần đã sử dụng

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date; // Ngày bắt đầu

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date; // Ngày hết hạn

  @Column({ default: 'active' })
  status: string; // active, inactive, expired

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

