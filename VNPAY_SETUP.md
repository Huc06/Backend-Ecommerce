# 💳 VNPAY Payment Integration Setup

## 📦 Installation

VNPAY integration sử dụng built-in Node.js modules (crypto, querystring), không cần install thêm package.

## 🔑 Environment Variables

Thêm các biến sau vào `.env`:

```env
# VNPAY Configuration
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Sandbox
# VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html  # Production
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-return  # Local
# VNPAY_RETURN_URL=https://your-domain.com/api/payments/vnpay-return  # Production
```

### Lấy VNPAY Credentials:

1. Đăng ký tại [VNPAY](https://www.vnpayment.vn/)
2. **TMN Code (Terminal Code):** Được cung cấp khi đăng ký tài khoản
3. **Secret Key:** Được cung cấp trong VNPAY Dashboard
4. **Sandbox URL:** Dùng cho testing
5. **Production URL:** Dùng cho production

### Return URL Setup:

Return URL phải được config trong VNPAY Dashboard:
- **Local:** `http://localhost:3000/api/payments/vnpay-return`
- **Production:** `https://your-domain.com/api/payments/vnpay-return`

---

## 🚀 API Endpoints

### 1. Create Payment URL

Tạo payment URL cho một order.

```http
POST /api/payments/create-payment-url
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "<order-uuid>",
  "bankCode": "NCB"  // Optional: specific bank code
}
```

**Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "vnpTxnRef": "abc123xyz",
  "amount": 999.99,
  "orderId": "uuid"
}
```

**Frontend:** Redirect user đến `paymentUrl`

### 2. VNPAY Return URL (Callback)

VNPAY sẽ redirect user về URL này sau khi thanh toán.

```http
GET /api/payments/vnpay-return?vnp_Amount=...&vnp_BankCode=...&vnp_ResponseCode=00&...
```

**Response:**
```json
{
  "success": true,
  "paymentId": "uuid",
  "orderId": "uuid",
  "status": "succeeded",
  "message": "Thanh toán thành công",
  "responseCode": "00"
}
```

### 3. VNPAY IPN (Instant Payment Notification)

VNPAY server sẽ gọi endpoint này để notify payment status.

```http
GET /api/payments/vnpay-ipn?vnp_Amount=...&vnp_BankCode=...&vnp_ResponseCode=00&...
```

**Response:** Same as Return URL

### 4. Get Payment by Order

Lấy thông tin payment của một order.

```http
GET /api/payments/order/:orderId
Authorization: Bearer <jwt_token>
```

### 5. Get All Payments

Lấy tất cả payments của user.

```http
GET /api/payments
Authorization: Bearer <jwt_token>
```

---

## 📱 Frontend Integration

### 1. Create Payment URL

```javascript
// 1. User checkout → Create Order
const order = await checkoutCart(shippingAddress);

// 2. Create payment URL
const response = await fetch('/api/payments/create-payment-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ orderId: order.id }),
});

const { paymentUrl } = await response.json();

// 3. Redirect user to VNPAY
window.location.href = paymentUrl;
```

### 2. Handle Return URL

```javascript
// After VNPAY redirects back
// In your return page component
useEffect(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(queryParams);
  
  // Verify payment
  fetch(`/api/payments/vnpay-return?${queryParams.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Show success message
        // Redirect to order confirmation page
        router.push(`/orders/${data.orderId}`);
      } else {
        // Show error message
        alert(data.message);
      }
    });
}, []);
```

---

## 📝 Payment Flow

```
1. User checkout cart → Create Order
2. Frontend calls: POST /api/payments/create-payment-url
3. Backend generates VNPAY payment URL → returns URL
4. Frontend redirects user to VNPAY payment page
5. User completes payment on VNPAY
6. VNPAY redirects to: GET /api/payments/vnpay-return
7. Backend verifies payment & updates order status
8. VNPAY also calls: GET /api/payments/vnpay-ipn (server-to-server)
```

---

## 🧪 Testing với VNPAY Sandbox

### Test Cards:

VNPAY Sandbox cung cấp các thẻ test:

| Card Number | Scenario |
|-------------|----------|
| `9704198526191432198` | Thành công |
| `9704198526191432199` | Thất bại |

**Thông tin test:**
- **Ngân hàng:** NCB
- **Ngày hết hạn:** Bất kỳ ngày trong tương lai
- **OTP:** `123456`

### Test Bank Codes:

```
NCB - Ngân hàng Quốc Dân
VIETCOMBANK - Ngân hàng Ngoại Thương
VIETINBANK - Ngân hàng Công Thương
AGRIBANK - Ngân hàng Nông nghiệp
...
```

---

## 🔐 Security

### Hash Verification:

VNPAY sử dụng SHA512 HMAC để verify payment data. Code tự động verify:

1. **Return URL:** Verify khi user redirect về
2. **IPN:** Verify khi VNPAY server gọi callback

### Important:

- ✅ **Always verify hash** - không tin tưởng data nếu hash không khớp
- ✅ **Check response code** - chỉ `00` là thành công
- ✅ **Verify amount** - đảm bảo amount trong callback khớp với order
- ✅ **Idempotency** - handle duplicate callbacks

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| `00` | Giao dịch thành công |
| `07` | Trừ tiền thành công. Giao dịch bị nghi ngờ |
| `09` | Thẻ/Tài khoản chưa đăng ký dịch vụ |
| `10` | Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| `11` | Đã hết hạn chờ thanh toán |
| `12` | Thẻ/Tài khoản bị khóa |
| `13` | Nhập sai mật khẩu xác thực giao dịch (OTP) |
| `51` | Tài khoản không đủ số dư |
| `65` | Tài khoản đã vượt quá hạn mức giao dịch trong ngày |
| `75` | Ngân hàng thanh toán đang bảo trì |
| `79` | Nhập sai mật khẩu thanh toán quá số lần quy định |
| `99` | Lỗi không xác định |

---

## ⚠️ Important Notes

1. **Sandbox vs Production:**
   - Sandbox: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
   - Production: `https://www.vnpayment.vn/paymentv2/vpcpay.html`

2. **Amount Format:**
   - VNPAY yêu cầu amount tính bằng **đồng VND**
   - Code tự động convert từ decimal sang VND (nhân 100)

3. **Currency:**
   - Hiện tại chỉ support VND
   - Currency code: `VND`

4. **Return URL:**
   - Phải là public URL (không được localhost trong production)
   - Phải được config trong VNPAY Dashboard

5. **IPN vs Return URL:**
   - **Return URL:** User browser redirect (có thể bị user cancel)
   - **IPN:** Server-to-server callback (đáng tin cậy hơn)

---

## 🔄 Integration với Checkout Flow

```javascript
// Complete checkout flow with VNPAY
async function checkoutWithVNPay(cart, shippingAddress) {
  // 1. Create order
  const order = await checkoutCart(shippingAddress);
  
  // 2. Create payment URL
  const { paymentUrl } = await createPaymentUrl(order.id);
  
  // 3. Redirect to VNPAY
  window.location.href = paymentUrl;
}

// After payment (return page)
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const result = await verifyPayment(params);
  
  if (result.success) {
    // Show success, redirect to order page
  } else {
    // Show error
  }
}
```

---

**Last Updated:** 2025-11-02

