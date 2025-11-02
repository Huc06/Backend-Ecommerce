# 💳 Stripe Payment Integration Setup

## 📦 Installation

Stripe package đã được install:
```bash
pnpm add stripe
```

## 🔑 Environment Variables

Thêm các biến sau vào `.env`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret
```

### Lấy Stripe Keys:

1. Đăng ký/Login tại [Stripe Dashboard](https://dashboard.stripe.com)
2. Chuyển sang **Test mode** (toggle ở góc trên bên phải)
3. **Secret Key:**
   - Vào **Developers** → **API keys**
   - Copy **Secret key** (bắt đầu với `sk_test_...`)
4. **Webhook Secret:**
   - Vào **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: chọn `payment_intent.succeeded` và `payment_intent.payment_failed`
   - Copy **Signing secret** (bắt đầu với `whsec_...`)

## 🚀 API Endpoints

### 1. Create Payment Intent

Tạo payment intent cho một order.

```http
POST /api/payments/create-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "<order-uuid>"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 99.99,
  "status": "requires_payment_method"
}
```

### 2. Confirm Payment

Confirm payment sau khi user đã nhập thẻ.

```http
POST /api/payments/confirm
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "paymentId": "uuid",
  "orderId": "uuid",
  "status": "succeeded",
  "amount": 99.99,
  "paymentIntentId": "pi_xxx"
}
```

### 3. Get Payment by Order

Lấy thông tin payment của một order.

```http
GET /api/payments/order/:orderId
Authorization: Bearer <jwt_token>
```

### 4. Get All Payments

Lấy tất cả payments của user.

```http
GET /api/payments
Authorization: Bearer <jwt_token>
```

### 5. Webhook (Stripe → Backend)

Stripe sẽ gọi endpoint này khi có event.

```http
POST /api/payments/webhook
stripe-signature: <signature>
```

**⚠️ Webhook endpoint KHÔNG có JWT guard** - Stripe sẽ gọi trực tiếp.

## 📱 Frontend Integration

### 1. Install Stripe.js

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Create Payment Flow

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...your_publishable_key');

// 1. Create payment intent
const response = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ orderId: order.id }),
});

const { clientSecret } = await response.json();

// 2. Confirm payment with Stripe Elements
const stripe = await stripePromise;
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: user.fullName,
      },
    },
  }
);

// 3. Confirm on backend
if (paymentIntent.status === 'succeeded') {
  await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id,
    }),
  });
}
```

## 🧪 Testing với Stripe Test Cards

Stripe cung cấp test cards:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |

**Expiry:** Bất kỳ ngày trong tương lai (ví dụ: `12/25`)  
**CVC:** Bất kỳ 3 số (ví dụ: `123`)  
**ZIP:** Bất kỳ 5 số (ví dụ: `12345`)

## 📝 Payment Flow

```
1. User checkout cart → Create Order
2. Frontend calls: POST /api/payments/create-intent
3. Backend creates Stripe PaymentIntent → returns clientSecret
4. Frontend uses Stripe.js to collect card info
5. Frontend confirms payment with Stripe
6. Frontend calls: POST /api/payments/confirm
7. Backend updates Payment & Order status
8. Stripe sends webhook → Backend updates final status
```

## ⚠️ Important Notes

1. **Test Mode vs Live Mode:**
   - Test mode: dùng keys bắt đầu với `sk_test_` và `pk_test_`
   - Live mode: dùng keys bắt đầu với `sk_live_` và `pk_live_`

2. **Webhook Security:**
   - Luôn verify webhook signature
   - Webhook secret phải khớp với Stripe dashboard

3. **Error Handling:**
   - Handle payment failures gracefully
   - Show user-friendly error messages
   - Log payment errors for debugging

4. **Payment Status:**
   - `pending`: Payment intent created, chưa pay
   - `processing`: Payment đang xử lý
   - `succeeded`: Payment thành công
   - `failed`: Payment thất bại
   - `refunded`: Đã refund

## 🔐 Security Best Practices

1. **Never expose secret keys** - chỉ dùng trong backend
2. **Use webhooks** - không chỉ dựa vào frontend confirmation
3. **Validate amounts** - check amount trong webhook
4. **Idempotency** - handle duplicate webhooks
5. **Log everything** - log all payment events for audit

---

**Last Updated:** 2025-11-02

