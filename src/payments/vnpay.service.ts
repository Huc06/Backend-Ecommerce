import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

export interface VNPayPaymentParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Amount: number;
  vnp_CurrCode: string;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_Locale: string;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string;
  vnp_BankCode?: string;
}

@Injectable()
export class VNPayService {
  private tmnCode: string;
  private secretKey: string;
  private vnpUrl: string;
  private returnUrl: string;

  constructor(private configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.secretKey = this.configService.get<string>('VNPAY_SECRET_KEY') || '';
    this.vnpUrl = this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || 'http://localhost:3000/api/payments/vnpay-return';
  }

  /**
   * Create payment URL for VNPAY
   */
  createPaymentUrl(params: {
    amount: number;
    orderId: string;
    orderInfo: string;
    ipAddr: string;
    bankCode?: string;
  }): string {
    const date = new Date();
    const createDate = this.formatDate(date);
    
    const vnpParams: VNPayPaymentParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: params.amount * 100, // Convert to VND (cents)
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
    };

    if (params.bankCode) {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sort params and create secure hash
    const sortedParams = this.sortObject(vnpParams);
    const queryString = querystring.stringify(sortedParams);
    const secureHash = this.createSecureHash(queryString);

    return `${this.vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Verify callback data from VNPAY
   */
  verifyReturnUrl(query: Record<string, string>): {
    isValid: boolean;
    transactionRef: string;
    responseCode: string;
    transactionNo?: string;
    amount?: number;
  } {
    const secureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    // Sort and create hash
    const sortedParams = this.sortObject(query);
    const queryString = querystring.stringify(sortedParams);
    const checkSum = this.createSecureHash(queryString);

    const isValid = secureHash === checkSum;
    const responseCode = query.vnp_ResponseCode || '';
    const transactionRef = query.vnp_TxnRef || '';
    const transactionNo = query.vnp_TransactionNo || '';
    const amount = query.vnp_Amount ? parseInt(query.vnp_Amount) / 100 : 0;

    return {
      isValid,
      transactionRef,
      responseCode,
      transactionNo,
      amount,
    };
  }

  /**
   * Create secure hash (SHA512)
   */
  private createSecureHash(queryString: string): string {
    return crypto
      .createHmac('sha512', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Sort object by keys
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    
    keys.forEach((key) => {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        sorted[key] = obj[key];
      }
    });
    
    return sorted;
  }

  /**
   * Format date to VNPAY format (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Get response code message
   */
  getResponseCodeMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định',
    };
    
    return messages[code] || 'Mã lỗi không xác định';
  }
}

