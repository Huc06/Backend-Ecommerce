import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/orderItem.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  private async checkUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    // Check if user has any completed order containing this product
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
    });

    for (const order of orders) {
      // Only allow review for delivered orders
      if (order.status === 'delivered') {
        const hasProduct = order.items.some(item => item.productId === productId);
        if (hasProduct) {
          return true;
        }
      }
    }
    return false;
  }

  async create(userId: string, dto: CreateReviewDto) {
    // Check if product exists
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Check if user purchased this product (optional validation)
    // Comment this out if you want to allow reviews without purchase
    // Uncomment below to enforce purchase validation:
    // const hasPurchased = await this.checkUserPurchasedProduct(userId, dto.productId);
    // if (!hasPurchased) {
    //   throw new ForbiddenException('You can only review products you have purchased');
    // }

    const review = this.reviewRepo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
      status: 'active',
    });

    return this.reviewRepo.save(review);
  }

  async findAll(query: QueryReviewDto) {
    const { productId, userId, rating, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.status = :status', { status: 'active' });

    if (productId) {
      queryBuilder.andWhere('review.productId = :productId', { productId });
    }

    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId });
    }

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async findByProduct(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { productId, status: 'active' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      averageRating: Number(avgRating.toFixed(2)),
      totalRatings: total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(userId: string, id: string, dto: UpdateReviewDto, userRole?: string) {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only owner or admin can update
    if (review.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }

    return this.reviewRepo.save(review);
  }

  async remove(userId: string, id: string, userRole?: string) {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only owner or admin can delete
    if (review.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepo.remove(review);
    return { message: 'Review deleted successfully' };
  }
}

