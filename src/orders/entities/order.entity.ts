import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../entities/user.entity';
import { OrderItem } from './orderItem.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number; // Tổng tiền trước khi giảm giá

  @Column({ type: 'varchar', nullable: true })
  voucherCode: string; // Mã voucher đã áp dụng

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  voucherDiscount: number; // Số tiền giảm giá

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // Tổng tiền sau khi giảm giá

  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

