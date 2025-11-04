import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cartItem.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../entities/user.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, CartItem, Product, User]),
    VouchersModule, // Import để sử dụng VouchersService
    EmailModule, // Import để sử dụng EmailService
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Export để PaymentsModule có thể sử dụng
})
export class OrdersModule {}

