import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(@Request() req: any, @Body() dto: AddItemDto) {
    console.log('[cart.controller] addItem called', {
      userId: req.user?.id,
      dto,
      dtoType: typeof dto,
      productIdType: typeof dto?.productId,
      quantityType: typeof dto?.quantity,
      rawBody: req.body
    });
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:itemId')
  updateItem(@Request() req: any, @Param('itemId') itemId: string, @Body() dto: UpdateItemDto) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Request() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete('clear')
  clear(@Request() req: any) {
    return this.cartService.clearCart(req.user.id);
  }
}
