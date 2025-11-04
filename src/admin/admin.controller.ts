import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboardStats(@Request() req) {
    this.checkAdmin(req);
    return this.adminService.getDashboardStats();
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Revenue report' })
  async getRevenueReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.getRevenueReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/top-products')
  @ApiOperation({ summary: 'Get top selling products (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top products' })
  async getTopProducts(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    this.checkAdmin(req);
    return this.adminService.getTopProducts(limit);
  }

  @Get('orders/recent')
  @ApiOperation({ summary: 'Get recent orders (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent orders' })
  async getRecentOrders(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    this.checkAdmin(req);
    return this.adminService.getRecentOrders(limit);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: ['buyer', 'seller', 'admin'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'blocked'] })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(
    @Request() req,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.getUsers(role, status);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateUserStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    this.checkAdmin(req);
    return this.adminService.updateUserStatus(id, dto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  async updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    this.checkAdmin(req);
    return this.adminService.updateUserRole(id, dto);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews for moderation (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getReviews(
    @Request() req,
    @Query('status') status?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.getReviews(status);
  }

  @Patch('reviews/:id/status')
  @ApiOperation({ summary: 'Update review status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review status updated' })
  async updateReviewStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    this.checkAdmin(req);
    return this.adminService.updateReviewStatus(id, dto);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  async deleteReview(
    @Request() req,
    @Param('id') id: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.deleteReview(id);
  }
}

