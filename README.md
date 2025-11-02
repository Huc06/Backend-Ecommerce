# 🛒 E-Commerce Backend API

A modern e-commerce backend built with NestJS, PostgreSQL, TypeORM, JWT auth, and Docker.

---

## ✨ Features
- ✅ User Authentication (Register, Login)
- ✅ JWT Authentication with Passport Guards
- ✅ Protected Routes (Profile Management)
- ✅ Products Module (CRUD, search, filter, sort, pagination)
- ✅ Categories Module (Admin-only CRUD)
- ✅ Cart Module (Add/update/remove items, auto-create cart)
- ✅ Orders Module (Checkout cart, order management with transaction)
- ✅ Reviews Module (Product reviews with rating, validation)
- ✅ Payment Module (VNPAY integration with secure hash, IPN callback)
- ✅ Swagger/OpenAPI Documentation (Interactive API docs)
- ✅ PostgreSQL with TypeORM
- ✅ Docker Compose for DB + pgAdmin
- ✅ Input validation (class-validator)
- ✅ Global pipes, CORS, and env config
- ✅ File Uploads to IPFS via Pinata (JWT)

---

## 🧰 Tech Stack
- Framework: NestJS
- Database: PostgreSQL
- ORM: TypeORM
- Auth: JWT + Passport
- Validation: class-validator / class-transformer
- Container: Docker & Docker Compose
- Package manager: pnpm

---

## 📦 Prerequisites
- Node.js 18+
- pnpm
- Docker & Docker Compose

---

## 🚀 Getting Started

### 1) Clone & Install
```bash
git clone https://github.com/Huc06/Backend-Ecommerce.git
cd Backend-Ecommerce
pnpm install
```

### 2) Start Database (Docker)
```bash
docker compose up -d
```
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:8080`
  - Email: `admin@admin.com`
  - Password: `admin`

### 3) Environment Variables
Create `.env` in the project root:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_NAME=ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Pinata (IPFS uploads)
# Create a JWT in Pinata Dashboard → API Keys → Create New Key (JWT)
PINATA_JWT=eyJ...your_long_pinata_jwt...
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# VNPAY Payment Gateway
# Register at http://sandbox.vnpayment.vn/devreg/ to get credentials
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
# VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html  # Production
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-return
# VNPAY_RETURN_URL=https://your-domain.com/api/payments/vnpay-return  # Production

# App
PORT=3000
```

### 4) Start App
```bash
pnpm start:dev
```
- API base URL: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`
- **Swagger UI: `http://localhost:3000/api/docs`** 📚

---

## 📚 Swagger API Documentation

### Interactive API Docs
Access the **Swagger UI** at: **`http://localhost:3000/api/docs`**

### Features:
- ✅ **Interactive testing** - Test all API endpoints directly in browser
- ✅ **JWT Authentication** - Click "Authorize" button, paste your JWT token
- ✅ **Auto-generated docs** - Always up-to-date with code
- ✅ **Request/Response schemas** - See exactly what data to send/receive
- ✅ **Try it out** - Execute real API calls and see responses
- ✅ **Copy as cURL** - Export to use in terminal or other tools

### How to use:
1. Start the app: `pnpm start:dev`
2. Open browser: `http://localhost:3000/api/docs`
3. For protected endpoints:
   - Click **"Authorize"** button (top right)
   - Login first to get JWT token
   - Paste token in format: `your-jwt-token-here`
   - Click "Authorize"
4. Now you can test all endpoints!

### Available API Tags:
- **Auth** - Register, Login, Profile management
- **Products** - CRUD, search, filter, pagination
- **Categories** - Category management (admin only)
- **Cart** - Shopping cart operations
- **Orders** - Checkout and order management
- **Reviews** - Product reviews and ratings
- **Payments** - VNPAY payment integration
- **Uploads** - File uploads to IPFS

---

## 🔐 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "buyer" // optional: buyer | seller | admin
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "buyer",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "jwt-token-here"
}
```

### Profile (Protected)
- Auth header required: `Authorization: Bearer <jwt-token>`

Get profile
```http
GET /api/auth/profile
```

Update profile
```http
PUT /api/auth/profile
Content-Type: application/json

{
  "fullName": "New Name",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## 🛍️ Products Module

### Endpoints
- GET `/api/products` — List products with pagination, search, filter, sort
- GET `/api/products/:id` — Product detail
- POST `/api/products` — Create product (JWT required)
- PATCH `/api/products/:id` — Update product (owner or admin, JWT)
- DELETE `/api/products/:id` — Delete product (owner or admin, JWT)

### Product Model
- id: uuid
- name: string (max 200)
- description: text
- price: decimal(10,2)
- stock: number
- images: string[]
- status: 'active' | 'inactive' | 'out_of_stock'
- categoryId: uuid (FK)
- sellerId: uuid (FK to users)

### Query Params (GET /api/products)
- `search`: string (by name, ILIKE)
- `categoryId`: uuid
- `minPrice`: number
- `maxPrice`: number
- `page`: number (default 1)
- `limit`: number (default 10, max 100)
- `sortBy`: string (default `createdAt`)
- `sortOrder`: 'ASC' | 'DESC' (default `DESC`)

### Examples (curl)
```bash
# List products (page 1, limit 10)
curl "http://localhost:3000/api/products?limit=10"

# Search by name
curl "http://localhost:3000/api/products?search=iPhone"

# Filter by price range
curl "http://localhost:3000/api/products?minPrice=200&maxPrice=1000"

# Sort by price ASC
curl "http://localhost:3000/api/products?sortBy=price&sortOrder=ASC"

# Create product (requires JWT)
TOKEN="<your_jwt_token>"
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone model",
    "price": 999.99,
    "stock": 50,
    "categoryId": "<category-uuid>"
  }'
```

---

## 📤 File Uploads (IPFS via Pinata)

### Endpoint
- POST `/api/uploads/image` — Upload a single image file (field name: `file`) — JWT required

### Example (curl)
```bash
# Login to get API token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.access_token')

# Upload a local image
curl -X POST http://localhost:3000/api/uploads/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Response:
```json
{
  "cid": "Qm...",
  "url": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

Notes:
- Set `PINATA_JWT` in `.env` (Pinata Dashboard → API Keys → Create New Key (JWT)).
- Optional: set `PINATA_GATEWAY` to use a custom IPFS gateway.

---

## 🛒 Cart Module

### Endpoints (All require JWT)
- GET `/api/cart` — Get user's cart (auto-creates if not exists)
- POST `/api/cart/items` — Add item to cart
- PATCH `/api/cart/items/:itemId` — Update item quantity
- DELETE `/api/cart/items/:itemId` — Remove item from cart
- DELETE `/api/cart/clear` — Clear all items from cart

### Cart Model
- id: uuid
- userId: uuid (unique, FK to users)
- items: CartItem[] (one-to-many)
- itemsCount: number (auto-calculated)

### CartItem Model
- id: uuid
- cartId: uuid (FK to carts)
- productId: uuid (FK to products)
- productName: string (snapshot)
- unitPrice: decimal(10,2) (snapshot)
- quantity: number

### Examples (curl)
```bash
TOKEN="<your_jwt_token>"

# Get cart
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/cart

# Add item to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product-uuid>",
    "quantity": 2
  }'

# Update item quantity
curl -X PATCH http://localhost:3000/api/cart/items/<item-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'

# Clear cart
curl -X DELETE http://localhost:3000/api/cart/clear \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📦 Orders Module

### Endpoints (All require JWT)
- POST `/api/orders/checkout` — Checkout cart → create order (clears cart, updates stock)
- GET `/api/orders` — List all orders of authenticated user
- GET `/api/orders/:id` — Get order detail
- PATCH `/api/orders/:id/status` — Update order status (admin only)

### Order Model
- id: uuid
- userId: uuid (FK to users)
- totalAmount: decimal(10,2)
- status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
- shippingAddress: text
- notes: text (nullable)
- items: OrderItem[] (one-to-many)

### OrderItem Model
- id: uuid
- orderId: uuid (FK to orders)
- productId: uuid (FK to products)
- productName: string (snapshot)
- unitPrice: decimal(10,2) (snapshot)
- quantity: number

### Examples (curl)
```bash
TOKEN="<your_jwt_token>"

# Checkout cart
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "123 Main St, City, State 12345",
    "notes": "Please handle with care"
  }'

# List orders
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/orders

# Get order detail
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/orders/<order-id>

# Update order status (admin only)
curl -X PATCH http://localhost:3000/api/orders/<order-id>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
```

**Features:**
- ✅ Transaction-based checkout (atomic operations)
- ✅ Automatic stock update
- ✅ Cart cleared after successful checkout
- ✅ Price snapshot in OrderItem (price at checkout time)

---

## ⭐ Reviews Module

### Endpoints
- POST `/api/reviews` — Create review (JWT required)
- GET `/api/reviews` — List reviews (public, with filters)
- GET `/api/reviews/product/:productId` — List reviews for a product (public)
- GET `/api/reviews/:id` — Get review detail (public)
- PATCH `/api/reviews/:id` — Update review (owner/admin, JWT)
- DELETE `/api/reviews/:id` — Delete review (owner/admin, JWT)

### Review Model
- id: uuid
- userId: uuid (FK to users)
- productId: uuid (FK to products)
- rating: number (1-5)
- comment: text (nullable)
- status: 'active' | 'hidden'
- user: User (relation)
- product: Product (relation)

### Query Params (GET /api/reviews)
- `productId`: uuid (filter by product)
- `userId`: uuid (filter by user)
- `rating`: number (filter by rating)
- `page`: number (default 1)
- `limit`: number (default 10)

### Examples (curl)
```bash
TOKEN="<your_jwt_token>"

# Create review
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product-uuid>",
    "rating": 5,
    "comment": "Excellent product! Very satisfied."
  }'

# List reviews for a product
curl http://localhost:3000/api/reviews/product/<product-id>?page=1&limit=10

# List all reviews with filters
curl "http://localhost:3000/api/reviews?productId=<product-id>&rating=5"

# Update review
curl -X PATCH http://localhost:3000/api/reviews/<review-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Updated comment"
  }'

# Delete review
curl -X DELETE http://localhost:3000/api/reviews/<review-id> \
  -H "Authorization: Bearer $TOKEN"
```

**Response for GET /api/reviews/product/:id:**
```json
{
  "reviews": [...],
  "averageRating": 4.5,
  "totalRatings": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "totalPages": 1
  }
}
```

**Features:**
- ✅ Unique constraint: one review per user per product
- ✅ Rating validation (1-5)
- ✅ Average rating calculation
- ✅ Purchase validation (optional, can be enabled in code)
- ✅ Owner/admin-only for update/delete

---

## 💳 Payment Module (VNPAY)

### Endpoints
- POST `/api/payments/create-payment-url` — Create VNPAY payment URL (JWT required)
- GET `/api/payments/vnpay-return` — VNPAY return URL callback (public, verify only)
- GET `/api/payments/vnpay-ipn` — VNPAY IPN callback (public, updates DB)
- GET `/api/payments/order/:orderId` — Get payment by order ID (JWT required)
- GET `/api/payments` — List all payments of authenticated user (JWT required)

### Payment Model
- id: uuid
- orderId: uuid (FK to orders)
- userId: uuid (FK to users)
- amount: decimal(10,2)
- status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
- paymentMethod: string ('VNPAY', 'ATM', 'CREDIT_CARD', etc.)
- vnpTxnRef: string (VNPAY transaction reference)
- vnpTransactionNo: string (VNPAY transaction number)
- vnpResponseCode: string (VNPAY response code: '00' = success)
- vnpTransactionStatus: string (VNPAY transaction status: '00' = success)
- vnpBankCode: string (Bank code)
- vnpBankTranNo: string (Bank transaction number)
- vnpCardType: string (Card type: ATM, QRCODE)
- vnpPayDate: string (Payment date: yyyyMMddHHmmss)
- failureReason: text (nullable)
- metadata: jsonb (nullable)

### Payment Flow
1. **Create Payment URL**: User calls API → Server generates secure hash → Returns payment URL
2. **Redirect**: Frontend redirects user to VNPAY payment gateway
3. **Payment**: User completes payment on VNPAY
4. **Return URL**: VNPAY redirects user back → Verify signature (display only)
5. **IPN Callback**: VNPAY calls IPN URL → Server verifies & updates database → Returns RspCode

### Examples (curl)
```bash
TOKEN="<your_jwt_token>"

# Create payment URL for an order
curl -X POST http://localhost:3000/api/payments/create-payment-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<order-uuid>",
    "bankCode": "VNBANK"  // optional: VNBANK, VNPAYQR, INTCARD
  }'

# Response:
# {
#   "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
#   "vnpTxnRef": "abc123...",
#   "amount": 1000000.00,
#   "orderId": "<order-uuid>"
# }

# Frontend should redirect user to paymentUrl

# Get payment by order ID
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/payments/order/<order-id>

# List all payments
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/payments
```

**Features:**
- ✅ Secure hash generation (HMAC SHA512)
- ✅ Hash verification for return URL and IPN
- ✅ Automatic payment status update (via IPN callback)
- ✅ Automatic order status update (pending → processing on success)
- ✅ Support for multiple payment methods (ATM, QR Code, Credit Card)
- ✅ Transaction expiration (default: 15 minutes)
- ✅ Comprehensive error handling and response codes

**Setup VNPAY:**
1. Register at [VNPAY Sandbox](http://sandbox.vnpayment.vn/devreg/)
2. Get TMN Code and Secret Key from email
3. Add credentials to `.env`
4. Configure Return URL and IPN URL in VNPAY dashboard
   - Return URL: `http://localhost:3000/api/payments/vnpay-return` (development)
   - IPN URL: `http://localhost:3000/api/payments/vnpay-ipn` (development)
   - Use HTTPS URLs for production

---

## 🧪 Testing (manual)
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token for profile
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/profile
```

---

## 🗄️ Project Structure
```
src/
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── update-profile.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── query-product.dto.ts
│   │   └── update-product.dto.ts
│   ├── entities/
│   │   ├── category.entity.ts
│   │   └── product.entity.ts
│   ├── products.controller.ts
│   ├── products.module.ts
│   └── products.service.ts
├── categories/
│   ├── categories.controller.ts
│   ├── categories.module.ts
│   └── categories.service.ts
├── uploads/
│   ├── uploads.controller.ts
│   ├── uploads.module.ts
│   └── uploads.service.ts
├── cart/
│   ├── dto/
│   │   ├── add-item.dto.ts
│   │   └── update-item.dto.ts
│   ├── entities/
│   │   ├── cart.entity.ts
│   │   └── cartItem.entity.ts
│   ├── cart.controller.ts
│   ├── cart.module.ts
│   └── cart.service.ts
├── orders/
│   ├── dto/
│   │   ├── checkout.dto.ts
│   │   └── update-order-status.dto.ts
│   ├── entities/
│   │   ├── order.entity.ts
│   │   └── orderItem.entity.ts
│   ├── orders.controller.ts
│   ├── orders.module.ts
│   └── orders.service.ts
├── reviews/
│   ├── dto/
│   │   ├── create-review.dto.ts
│   │   ├── update-review.dto.ts
│   │   └── query-review.dto.ts
│   ├── entities/
│   │   └── review.entity.ts
│   ├── reviews.controller.ts
│   ├── reviews.module.ts
│   └── reviews.service.ts
├── payments/
│   ├── dto/
│   │   └── create-payment-intent.dto.ts
│   ├── entities/
│   │   └── payment.entity.ts
│   ├── payments.controller.ts
│   ├── payments.module.ts
│   ├── payments.service.ts
│   └── vnpay.service.ts
├── entities/
│   └── user.entity.ts
├── app.controller.ts
├── app.module.ts
└── main.ts
```

---

## 🐳 Docker Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs

# Reset database (WARNING: deletes all data)
docker compose down -v
```

---

## 📄 License
MIT

## 🤝 Contributing
- Fork -> Branch -> PR

---

Happy coding! 🎉