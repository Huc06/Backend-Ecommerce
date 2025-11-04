import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Review } from '../reviews/entities/review.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [totalUsers, totalProducts, totalOrders, pendingOrders] =
      await Promise.all([
        this.userRepo.count(),
        this.productRepo.count(),
        this.orderRepo.count(),
        this.orderRepo.count({ where: { status: 'pending' } }),
      ]);

    // Calculate total revenue
    const orders = await this.orderRepo.find();
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await this.orderRepo.find({
      where: {
        createdAt: Between(today, tomorrow),
      },
    });
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      todayOrders: todayOrders.length,
    };
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const end = endDate || new Date();

    const orders = await this.orderRepo.find({
      where: {
        createdAt: Between(start, end),
        status: 'delivered', // Only count delivered orders
      },
      order: { createdAt: 'DESC' },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by date
    const revenueByDate: Record<string, number> = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.totalAmount);
    });

    return {
      startDate: start,
      endDate: end,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByDate,
    };
  }

  /**
   * Get top selling products
   */
  async getTopProducts(limit: number = 10) {
    // This would be better with a proper aggregation query in production
    const products = await this.productRepo.find({
      relations: ['orderItems'],
    });

    const productSales = products.map((product: any) => {
      const totalSold = product.orderItems?.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ) || 0;
      const revenue = product.orderItems?.reduce(
        (sum: number, item: any) =>
          sum + Number(item.unitPrice) * item.quantity,
        0,
      ) || 0;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        totalSold,
        revenue,
      };
    });

    return productSales
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 10) {
    return this.orderRepo.find({
      relations: ['items', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get all users with filters
   */
  async getUsers(role?: string, status?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    return this.userRepo.find({
      where,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'fullName', 'role', 'status', 'createdAt'],
    });
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow blocking yourself or other admins
    if (user.role === 'admin') {
      throw new ForbiddenException('Cannot modify admin users');
    }

    user.status = dto.status;
    await this.userRepo.save(user);

    const { password, ...result } = user;
    return result;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = dto.role;
    await this.userRepo.save(user);

    const { password, ...result } = user;
    return result;
  }

  /**
   * Get all reviews for moderation
   */
  async getReviews(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.reviewRepo.find({
      where,
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update review status (approve/reject)
   */
  async updateReviewStatus(reviewId: string, dto: UpdateReviewStatusDto) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = dto.status;
    return this.reviewRepo.save(review);
  }

  /**
   * Delete review (admin only)
   */
  async deleteReview(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepo.remove(review);
    return { message: 'Review deleted successfully' };
  }
}

