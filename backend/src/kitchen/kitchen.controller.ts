import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('kitchen')
@UseGuards(JwtAuthGuard) // Bảo mật API bằng JWT
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('orders')
  getOrders() {
    return this.kitchenService.getPreparingOrders();
  }

  @Post('orders/:id/ready')
  markReady(@Param('id') id: string) {
    return this.kitchenService.markOrderReady(id);
  }

  @Post('orders/:id/item/:itemId/ready')
  markItemReady(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.kitchenService.markItemReady(id, itemId);
  }
}