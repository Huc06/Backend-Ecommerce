import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { Category } from './products/entities/category.entity';
import { CategoriesModule } from './categories/categories.module';
import { UploadsModule } from './uploads/uploads.module';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cartItem.entity';
import { CartModule } from './cart/cart.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/orderItem.entity';
import { OrdersModule } from './orders/orders.module';
import { Review } from './reviews/entities/review.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Payment } from './payments/entities/payment.entity';
import { PaymentsModule } from './payments/payments.module';
import { Voucher } from './vouchers/entities/voucher.entity';
import { VouchersModule } from './vouchers/vouchers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Nếu có DATABASE_URL (Render), dùng nó
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Product, Category, Cart, CartItem, Order, OrderItem, Review, Payment, Voucher],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            ssl: { rejectUnauthorized: false },
          };
        }
        
        // Fallback cho local development
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: parseInt(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USERNAME', 'admin'),
          password: configService.get<string>('DB_PASSWORD', 'admin123'),
          database: configService.get<string>('DB_NAME', 'ecommerce'),
          entities: [User, Product, Category, Cart, CartItem, Order, OrderItem, Review, Payment, Voucher],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UploadsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    PaymentsModule,
    VouchersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
