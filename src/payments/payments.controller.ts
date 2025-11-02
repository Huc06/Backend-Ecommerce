import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-url')
  @UseGuards(JwtAuthGuard)
  createPaymentUrl(@Request() req: any, @Body() dto: CreatePaymentIntentDto) {
    const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.paymentsService.createPaymentUrl(req.user.id, dto, ipAddr);
  }

  @Get('vnpay-return')
  async handleVNPayReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVNPayReturn(query);
  }

  @Get('vnpay-ipn')
  async handleVNPayIPN(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVNPayIPN(query);
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
}

