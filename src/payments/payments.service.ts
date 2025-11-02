import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { VNPayService } from './vnpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private vnpayService: VNPayService,
  ) {}

  async createPaymentUrl(userId: string, dto: CreatePaymentIntentDto, ipAddr: string) {
    // Get order
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order already paid
    const existingPayment = await this.paymentRepo.findOne({
      where: { orderId: order.id, status: 'succeeded' },
    });

    if (existingPayment) {
      throw new BadRequestException('Order already paid');
    }

    // Generate transaction reference (use order ID or create unique ref)
    const vnpTxnRef = order.id.substring(0, 8).replace(/-/g, '') + Date.now().toString().slice(-8);

    // Create or update payment record
    let payment = await this.paymentRepo.findOne({
      where: { orderId: order.id },
    });

    if (!payment) {
      payment = this.paymentRepo.create({
        orderId: order.id,
        userId: userId,
        amount: order.totalAmount,
        status: 'pending',
        paymentMethod: 'VNPAY',
        vnpTxnRef: vnpTxnRef,
      });
    } else {
      payment.vnpTxnRef = vnpTxnRef;
      payment.status = 'pending';
    }

    await this.paymentRepo.save(payment);

    // Create VNPAY payment URL
    const orderInfo = `Thanh toan don hang ${order.id.substring(0, 8)}`;
    const paymentUrl = this.vnpayService.createPaymentUrl({
      amount: Number(order.totalAmount),
      orderId: vnpTxnRef,
      orderInfo: orderInfo,
      ipAddr: ipAddr,
      bankCode: dto.bankCode,
    });

    return {
      paymentUrl,
      vnpTxnRef,
      amount: order.totalAmount,
      orderId: order.id,
    };
  }

  async handleVNPayReturn(query: Record<string, string>) {
    // Verify return URL
    const verifyResult = this.vnpayService.verifyReturnUrl(query);
    
    if (!verifyResult.isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find payment by transaction reference
    const payment = await this.paymentRepo.findOne({
      where: { vnpTxnRef: verifyResult.transactionRef },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    payment.vnpResponseCode = verifyResult.responseCode;
    if (verifyResult.transactionNo) {
      payment.vnpTransactionNo = verifyResult.transactionNo;
    }

    if (verifyResult.responseCode === '00') {
      // Success
      payment.status = 'succeeded';
      
      // Update order status
      if (payment.order) {
        payment.order.status = 'processing';
        await this.orderRepo.save(payment.order);
      }
    } else {
      // Failed
      payment.status = 'failed';
      payment.failureReason = this.vnpayService.getResponseCodeMessage(verifyResult.responseCode);
    }

    await this.paymentRepo.save(payment);

    return {
      success: verifyResult.responseCode === '00',
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      message: verifyResult.responseCode === '00' 
        ? 'Thanh toán thành công' 
        : this.vnpayService.getResponseCodeMessage(verifyResult.responseCode),
      responseCode: verifyResult.responseCode,
    };
  }

  async handleVNPayIPN(query: Record<string, string>) {
    // Similar to handleVNPayReturn but for IPN callback
    // IPN is called by VNPAY server, not by user browser redirect
    return this.handleVNPayReturn(query);
  }

  async getPaymentByOrderId(userId: string, orderId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { orderId, userId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getAllPayments(userId: string) {
    return this.paymentRepo.find({
      where: { userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }
}
