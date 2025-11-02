import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../entities/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'succeeded', 'failed', 'refunded'

  @Column({ nullable: true })
  paymentMethod: string; // 'VNPAY', 'ATM', 'CREDIT_CARD', etc.

  @Column({ nullable: true })
  vnpTxnRef: string; // VNPAY transaction reference

  @Column({ nullable: true })
  vnpTransactionNo: string; // VNPAY transaction number

  @Column({ nullable: true })
  vnpResponseCode: string; // VNPAY response code

  @Column({ nullable: true })
  vnpTransactionStatus: string; // VNPAY transaction status (00 = success)

  @Column({ nullable: true })
  vnpBankCode: string; // Bank code

  @Column({ nullable: true })
  vnpBankTranNo: string; // Bank transaction number

  @Column({ nullable: true })
  vnpCardType: string; // Card type (ATM, QRCODE)

  @Column({ nullable: true })
  vnpPayDate: string; // Payment date (yyyyMMddHHmmss)

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

