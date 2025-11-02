import { Controller, Post, Get, Body, Param, UseGuards, Request, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Request() req: any, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  confirmPayment(@Request() req: any, @Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(req.user.id, dto);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  getPaymentByOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(req.user.id, orderId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllPayments(@Request() req: any) {
    return this.paymentsService.getAllPayments(req.user.id);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}

