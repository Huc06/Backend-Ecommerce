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
    // Verify return URL (chỉ verify và hiển thị, KHÔNG cập nhật DB)
    const verifyResult = this.vnpayService.verifyCallback(query);
    
    if (!verifyResult.isValid) {
      return {
        success: false,
        message: 'Invalid payment signature',
        responseCode: '97',
      };
    }

    // Find payment by transaction reference (chỉ để hiển thị)
    const payment = await this.paymentRepo.findOne({
      where: { vnpTxnRef: verifyResult.transactionRef },
    });

    const isSuccess = verifyResult.responseCode === '00' && verifyResult.transactionStatus === '00';
    
    return {
      success: isSuccess,
      paymentId: payment?.id || null,
      orderId: payment?.orderId || null,
      status: payment?.status || 'unknown',
      message: isSuccess
        ? 'Thanh toán thành công'
        : this.vnpayService.getResponseCodeMessage(verifyResult.responseCode),
      responseCode: verifyResult.responseCode,
      transactionStatus: verifyResult.transactionStatus,
    };
  }

  async handleVNPayIPN(query: Record<string, string>) {
    // Verify IPN callback
    const verifyResult = this.vnpayService.verifyCallback(query);
    
    // IPN phải trả về JSON với RspCode
    if (!verifyResult.isValid) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }

    // Find payment by transaction reference
    const payment = await this.paymentRepo.findOne({
      where: { vnpTxnRef: verifyResult.transactionRef },
      relations: ['order'],
    });

    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Check if already processed
    if (payment.status === 'succeeded' && verifyResult.responseCode === '00') {
      return { RspCode: '00', Message: 'success' };
    }

    // Update payment status
    payment.vnpResponseCode = verifyResult.responseCode;
    payment.vnpTransactionStatus = verifyResult.transactionStatus;
    if (verifyResult.transactionNo) {
      payment.vnpTransactionNo = verifyResult.transactionNo;
    }
    if (verifyResult.bankCode) {
      payment.vnpBankCode = verifyResult.bankCode;
    }
    if (verifyResult.bankTranNo) {
      payment.vnpBankTranNo = verifyResult.bankTranNo;
    }
    if (verifyResult.cardType) {
      payment.vnpCardType = verifyResult.cardType;
    }
    if (verifyResult.payDate) {
      payment.vnpPayDate = verifyResult.payDate;
    }

    // Check if transaction is successful
    const isSuccess = verifyResult.responseCode === '00' && verifyResult.transactionStatus === '00';

    if (isSuccess) {
      payment.status = 'succeeded';
      
      // Update order status
      if (payment.order) {
        payment.order.status = 'processing';
        await this.orderRepo.save(payment.order);
      }
    } else {
      payment.status = 'failed';
      payment.failureReason = this.vnpayService.getResponseCodeMessage(verifyResult.responseCode);
    }

    try {
      await this.paymentRepo.save(payment);
      return { RspCode: '00', Message: 'success' };
    } catch (error) {
      return { RspCode: '99', Message: 'Update failed' };
    }
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
