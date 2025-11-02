import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create VNPAY payment URL for an order' })
  @ApiResponse({ status: 200, description: 'Payment URL created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (order not found or already paid)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreatePaymentIntentDto })
  createPaymentUrl(@Request() req: any, @Body() dto: CreatePaymentIntentDto) {
    const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.paymentsService.createPaymentUrl(req.user.id, dto, ipAddr);
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPAY return URL callback (user redirected here after payment)' })
  @ApiResponse({ status: 200, description: 'Payment result verified (display only, no DB update)' })
  @ApiQuery({ name: 'vnp_TxnRef', required: true, description: 'VNPAY transaction reference' })
  @ApiQuery({ name: 'vnp_ResponseCode', required: true, description: 'VNPAY response code' })
  @ApiQuery({ name: 'vnp_SecureHash', required: true, description: 'VNPAY secure hash' })
  async handleVNPayReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVNPayReturn(query);
  }

  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPAY IPN callback (server-to-server, updates DB)' })
  @ApiResponse({ status: 200, description: 'IPN processed, returns RspCode' })
  @ApiQuery({ name: 'vnp_TxnRef', required: true, description: 'VNPAY transaction reference' })
  @ApiQuery({ name: 'vnp_ResponseCode', required: true, description: 'VNPAY response code' })
  @ApiQuery({ name: 'vnp_SecureHash', required: true, description: 'VNPAY secure hash' })
  async handleVNPayIPN(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVNPayIPN(query);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment by order ID' })
  @ApiResponse({ status: 200, description: 'Returns payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  getPaymentByOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(req.user.id, orderId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments of authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of payments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAllPayments(@Request() req: any) {
    return this.paymentsService.getAllPayments(req.user.id);
  }
}

