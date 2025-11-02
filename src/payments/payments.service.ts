import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey);
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    // Get order
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order already has a payment
    const existingPayment = await this.paymentRepo.findOne({
      where: { orderId: order.id },
    });

    if (existingPayment && existingPayment.status === 'succeeded') {
      throw new BadRequestException('Order already paid');
    }

    // Create or get existing payment intent
    if (existingPayment?.stripePaymentIntentId) {
      // Retrieve existing payment intent
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          existingPayment.stripePaymentIntentId,
        );

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from cents
          status: paymentIntent.status,
        };
      } catch (error) {
        // If payment intent not found, create new one
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record
    const payment = this.paymentRepo.create({
      orderId: order.id,
      userId: userId,
      amount: order.totalAmount,
      status: 'pending',
      paymentMethod: 'card',
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret!,
    });

    await this.paymentRepo.save(payment);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      status: paymentIntent.status,
    };
  }

  async confirmPayment(userId: string, dto: ConfirmPaymentDto) {
    // Find payment by payment intent ID
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: dto.paymentIntentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user owns this payment
    if (payment.userId !== userId) {
      throw new BadRequestException('Payment does not belong to this user');
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      dto.paymentIntentId,
    );

    // Update payment status based on Stripe status
    payment.status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      // Update order status to processing
      if (payment.order) {
        payment.order.status = 'processing';
        await this.orderRepo.save(payment.order);
      }
    } else if (paymentIntent.status === 'requires_payment_method') {
      payment.failureReason = 'Payment method required';
    } else if (paymentIntent.status === 'canceled') {
      payment.failureReason = 'Payment canceled';
    }

    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['order'],
    });

    if (payment) {
      payment.status = 'succeeded';
      await this.paymentRepo.save(payment);

      // Update order status
      if (payment.order) {
        payment.order.status = 'processing';
        await this.orderRepo.save(payment.order);
      }
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = 'failed';
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentRepo.save(payment);
    }
  }

  private mapStripeStatusToPaymentStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'processing',
      'requires_action': 'processing',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'failed',
    };
    return statusMap[stripeStatus] || 'pending';
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

