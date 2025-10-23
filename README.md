# 🛒 E-Commerce Backend API

A modern e-commerce backend API built with **NestJS**, **PostgreSQL**, and **TypeORM**.

## 🚀 Features

- ✅ **User Authentication** (Register/Login)
- ✅ **JWT Token Authentication**
- ✅ **PostgreSQL Database** with TypeORM
- ✅ **Docker Support** for database
- ✅ **Input Validation** with class-validator
- ✅ **CORS Enabled**
- ✅ **Environment Configuration**

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Container**: Docker & Docker Compose
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js (v18+)
- pnpm
- Docker & Docker Compose

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Huc06/Backend-Ecommerce.git
cd Backend-Ecommerce
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Start Application
```bash
pnpm start:dev
```

## 🗄️ Database Setup

The application uses PostgreSQL with Docker Compose:

- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:8080`
  - Email: `admin@admin.com`
  - Password: `admin`

### Database Credentials
- Database: `ecommerce`
- Username: `admin`
- Password: `admin123`

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "buyer" // optional: buyer, seller, admin
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
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

### Health Check
```http
GET /api/health
```

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data Transfer Objects
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── entities/            # Database entities
│   └── user.entity.ts
├── app.controller.ts
├── app.module.ts
└── main.ts
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

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

# Application
PORT=3000
```

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

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📊 Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR | Unique email address |
| password | VARCHAR | Hashed password |
| fullName | VARCHAR | User's full name |
| role | VARCHAR | User role (buyer/seller/admin) |
| status | VARCHAR | Account status (active/inactive/banned) |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Environment-based configuration

## 🚧 Development

### Available Scripts

```bash
# Development
pnpm start:dev

# Production build
pnpm build

# Start production
pnpm start:prod

# Linting
pnpm lint

# Testing
pnpm test
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy Coding! 🎉**