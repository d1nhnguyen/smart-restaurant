import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderItemStatus } from '@prisma/client';

@Injectable()
export class KitchenService {
  constructor(private prisma: PrismaService) {}

  // Lấy các đơn hàng có status là PREPARING
  async getPreparingOrders() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PREPARING,
      },
      include: {
        table: true, // Để lấy số bàn
        items: {
          include: {
            selectedModifiers: true, // Để lấy các tùy chọn (ví dụ: ít đường, không hành)
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // FIFO: Đơn cũ hiện trước
      },
    });
  }

  // Đánh dấu toàn bộ Order là READY
  async markOrderReady(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order không tồn tại');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.READY,
        // Sử dụng updatedAt làm mốc thời gian Ready
      },
    });
  }

  // Đánh dấu từng Item là READY (Optional)
  async markItemReady(orderId: string, itemId: string) {
    return this.prisma.orderItem.update({
      where: { id: itemId, orderId: orderId },
      data: { 
        status: OrderItemStatus.READY,
        preparedAt: new Date(), // Ghi nhận thời gian xong món
      },
    });
  }
}