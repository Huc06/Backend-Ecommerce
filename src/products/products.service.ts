import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string) {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    const category = await this.categoriesRepository.findOne({
      where: { id: createProductDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      sellerId,
    });

    const saved = await this.productsRepository.save(product);
    return this.findOne(saved.id);
  }

  async findAll(queryDto: QueryProductDto) {
    const { search, categoryId, minPrice, maxPrice, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('product.status = :status', { status: 'active' });

    if (search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${search}%` });
    }
    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    qb.orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'seller'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string, userRole: string) {
    const product = await this.findOne(id);

    if (product.sellerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own products');
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepository.findOne({ where: { id: updateProductDto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(product, updateProductDto);
    await this.productsRepository.save(product);
    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: string) {
    const product = await this.findOne(id);
    if (product.sellerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own products');
    }
    await this.productsRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }
}
