import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to E-Commerce Platform! 🎉',
        template: 'welcome',
        context: {
          fullName,
          email,
          shopUrl: process.env.FRONTEND_URL || 'https://ecommerce-platform.com',
        },
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error, just log it (email sending should not block registration)
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: Order, customerEmail: string, customerName: string): Promise<void> {
    try {
      const items = order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toLocaleString('vi-VN'),
        total: (Number(item.unitPrice) * item.quantity).toLocaleString('vi-VN'),
      }));

      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `Order Confirmation #${order.id.substring(0, 8)}`,
        template: 'order-confirmation',
        context: {
          customerName,
          orderId: order.id.substring(0, 8).toUpperCase(),
          orderDate: new Date(order.createdAt).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: order.status,
          items,
          subtotal: Number(order.subtotal).toLocaleString('vi-VN'),
          voucherCode: order.voucherCode,
          voucherDiscount: order.voucherDiscount
            ? Number(order.voucherDiscount).toLocaleString('vi-VN')
            : null,
          totalAmount: Number(order.totalAmount).toLocaleString('vi-VN'),
          shippingAddress: order.shippingAddress,
          notes: order.notes,
          orderTrackingUrl: `${process.env.FRONTEND_URL || 'https://ecommerce-platform.com'}/orders/${order.id}`,
        },
      });
      this.logger.log(`Order confirmation email sent to ${customerEmail} for order ${order.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email to ${customerEmail}:`,
        error,
      );
      // Don't throw error, just log it (email sending should not block order creation)
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(
    order: Order,
    customerEmail: string,
    customerName: string,
    newStatus: string,
  ): Promise<void> {
    try {
      let subject = 'Order Status Update';
      let statusMessage = '';

      switch (newStatus) {
        case 'processing':
          subject = 'Your Order is Being Processed';
          statusMessage = 'Your order is now being processed and will be shipped soon.';
          break;
        case 'shipped':
          subject = 'Your Order Has Been Shipped!';
          statusMessage = 'Great news! Your order has been shipped and is on its way to you.';
          break;
        case 'delivered':
          subject = 'Your Order Has Been Delivered';
          statusMessage = 'Your order has been successfully delivered. We hope you enjoy your purchase!';
          break;
        case 'cancelled':
          subject = 'Your Order Has Been Cancelled';
          statusMessage = 'Your order has been cancelled. If you have any questions, please contact our support team.';
          break;
      }

      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `${subject} - Order #${order.id.substring(0, 8)}`,
        html: `
          <h2>${subject}</h2>
          <p>Hi ${customerName},</p>
          <p>${statusMessage}</p>
          <p><strong>Order ID:</strong> ${order.id.substring(0, 8).toUpperCase()}</p>
          <p><strong>New Status:</strong> ${newStatus}</p>
          <p><a href="${process.env.FRONTEND_URL || 'https://ecommerce-platform.com'}/orders/${order.id}">View Order Details</a></p>
          <p>Thank you for shopping with us!</p>
        `,
      });
      this.logger.log(`Order status update email sent to ${customerEmail} for order ${order.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order status update email to ${customerEmail}:`,
        error,
      );
    }
  }
}

