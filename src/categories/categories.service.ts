import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../products/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Only admin can create categories');
    }
    const exists = await this.categoriesRepository.findOne({ where: { name: dto.name } });
    if (exists) {
      throw new ForbiddenException('Category name already exists');
    }
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async findAll() {
    return this.categoriesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Only admin can update categories');
    }
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string, role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Only admin can delete categories');
    }
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
