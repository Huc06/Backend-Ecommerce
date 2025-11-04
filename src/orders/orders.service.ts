import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cartItem.entity';
import { Product } from '../products/entities/product.entity';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private dataSource: DataSource,
    private vouchersService: VouchersService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // Get user's cart with items
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate subtotal and validate stock
    let subtotal = 0;
    for (const item of cart.items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }
      subtotal += Number(item.unitPrice) * item.quantity;
    }

    // Apply voucher if provided
    let voucherCode: string | undefined = undefined;
    let voucherDiscount = 0;
    let voucherId: string | undefined = undefined;

    if (dto.voucherCode) {
      const result = await this.vouchersService.validateAndCalculateDiscount(
        dto.voucherCode,
        subtotal,
      );
      voucherCode = result.voucher.code;
      voucherDiscount = result.discountAmount;
      voucherId = result.voucher.id;
    }

    // Calculate final total amount
    const totalAmount = subtotal - voucherDiscount;

    // Use transaction to ensure consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const order = this.orderRepo.create({
        userId,
        subtotal,
        voucherCode,
        voucherDiscount,
        totalAmount,
        status: 'pending',
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
      });
      const savedOrder = await queryRunner.manager.save(order);

      // Create order items and update product stock
      for (const cartItem of cart.items) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: cartItem.productId } });
        
        if (!product) {
          throw new NotFoundException(`Product ${cartItem.productId} not found`);
        }

        // Create order item
        const orderItem = this.orderItemRepo.create({
          orderId: savedOrder.id,
          productId: cartItem.productId,
          productName: product.name,
          unitPrice: cartItem.unitPrice,
          quantity: cartItem.quantity,
        });
        await queryRunner.manager.save(orderItem);

        // Update product stock
        product.stock -= cartItem.quantity;
        if (product.stock < 0) {
          throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
        }
        await queryRunner.manager.save(product);
      }

      // Clear cart
      await queryRunner.manager.remove(cart.items);
      await queryRunner.manager.remove(cart);

      // Increment voucher usage count if applied
      if (voucherId) {
        await this.vouchersService.incrementUsage(voucherId);
      }

      await queryRunner.commitTransaction();

      // Return order with items
      return await this.orderRepo.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // User can only view their own orders (unless admin)
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, userRole?: string) {
    // Only admin can update order status
    if (userRole !== 'admin') {
      throw new BadRequestException('Only admin can update order status');
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = dto.status;
    return this.orderRepo.save(order);
  }
}

