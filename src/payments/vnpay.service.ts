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
  vnp_ExpireDate: string;
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
    expireMinutes?: number; // Default: 15 minutes
  }): string {
    const date = new Date();
    const createDate = this.formatDate(date);
    
    // Calculate expire date (default: 15 minutes from now)
    const expireMinutes = params.expireMinutes || 15;
    const expireDate = new Date(date.getTime() + expireMinutes * 60 * 1000);
    const expireDateStr = this.formatDate(expireDate);
    
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
      vnp_ExpireDate: expireDateStr,
    };

    if (params.bankCode) {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sort params and create secure hash
    // Remove null/undefined/empty before sorting
    const cleanedParams = this.cleanObject(vnpParams);
    const sortedParams = this.sortObject(cleanedParams);
    const queryString = querystring.stringify(sortedParams);
    const secureHash = this.createSecureHash(queryString);

    return `${this.vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Verify callback data from VNPAY
   */
  verifyCallback(query: Record<string, string>): {
    isValid: boolean;
    transactionRef: string;
    responseCode: string;
    transactionStatus: string;
    transactionNo?: string;
    amount?: number;
    bankCode?: string;
    bankTranNo?: string;
    cardType?: string;
    payDate?: string;
  } {
    const secureHash = query.vnp_SecureHash;
    const originalQuery = { ...query };
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    // Sort and create hash
    const cleanedQuery = this.cleanObject(query);
    const sortedParams = this.sortObject(cleanedQuery);
    const queryString = querystring.stringify(sortedParams);
    const checkSum = this.createSecureHash(queryString);

    const isValid = secureHash === checkSum;
    const responseCode = originalQuery.vnp_ResponseCode || '';
    const transactionStatus = originalQuery.vnp_TransactionStatus || '';
    const transactionRef = originalQuery.vnp_TxnRef || '';
    const transactionNo = originalQuery.vnp_TransactionNo || '';
    const amount = originalQuery.vnp_Amount ? parseInt(originalQuery.vnp_Amount) / 100 : 0;
    const bankCode = originalQuery.vnp_BankCode || '';
    const bankTranNo = originalQuery.vnp_BankTranNo || '';
    const cardType = originalQuery.vnp_CardType || '';
    const payDate = originalQuery.vnp_PayDate || '';

    return {
      isValid,
      transactionRef,
      responseCode,
      transactionStatus,
      transactionNo,
      amount,
      bankCode,
      bankTranNo,
      cardType,
      payDate,
    };
  }

  /**
   * Create secure hash (SHA512 HMAC)
   */
  private createSecureHash(queryString: string): string {
    return crypto
      .createHmac('sha512', this.secretKey)
      .update(Buffer.from(queryString, 'utf-8'))
      .digest('hex');
  }

  /**
   * Remove null, undefined, empty string values
   */
  private cleanObject(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }

  /**
   * Sort object by keys (alphabetically)
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    
    keys.forEach((key) => {
      sorted[key] = obj[key];
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
   * Get response code message (vnp_ResponseCode)
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
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác',
    };
    
    return messages[code] || 'Mã lỗi không xác định';
  }

  /**
   * Get transaction status message (vnp_TransactionStatus)
   */
  getTransactionStatusMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)',
      '05': 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)',
      '06': 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)',
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'GD Hoàn trả bị từ chối',
    };
    
    return messages[code] || 'Mã trạng thái không xác định';
  }
}

