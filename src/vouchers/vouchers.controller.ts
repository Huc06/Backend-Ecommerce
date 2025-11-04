import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new voucher (Admin only)' })
  @ApiBody({ type: CreateVoucherDto })
  @ApiResponse({ status: 201, description: 'Voucher created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Voucher code already exists' })
  async create(@Request() req, @Body() createVoucherDto: CreateVoucherDto) {
    // Only admin can create vouchers
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create vouchers');
    }
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vouchers' })
  @ApiResponse({ status: 200, description: 'List of vouchers' })
  findAll() {
    return this.vouchersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a voucher by ID' })
  @ApiResponse({ status: 200, description: 'Voucher details' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a voucher (Admin only)' })
  @ApiBody({ type: UpdateVoucherDto })
  @ApiResponse({ status: 200, description: 'Voucher updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    // Only admin can update vouchers
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update vouchers');
    }
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a voucher (Admin only)' })
  @ApiResponse({ status: 200, description: 'Voucher deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async remove(@Request() req, @Param('id') id: string) {
    // Only admin can delete vouchers
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete vouchers');
    }
    await this.vouchersService.remove(id);
    return { message: 'Voucher deleted successfully' };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate a voucher code and calculate discount' })
  @ApiBody({ type: ApplyVoucherDto })
  @ApiResponse({
    status: 200,
    description: 'Voucher is valid',
    schema: {
      example: {
        voucher: {
          id: 'uuid',
          code: 'SUMMER2025',
          description: 'Summer sale 2025 - 20% off',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValue: 100000,
          maxDiscountAmount: 50000,
        },
        discountAmount: 40000,
        message: 'Voucher applied successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Voucher is invalid or expired' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async validateVoucher(
    @Body() applyVoucherDto: ApplyVoucherDto,
    @Body('orderTotal') orderTotal: number = 200000, // For testing, allow orderTotal in body
  ) {
    const result = await this.vouchersService.validateAndCalculateDiscount(
      applyVoucherDto.code,
      orderTotal,
    );

    return {
      ...result,
      message: 'Voucher applied successfully',
    };
  }
}

