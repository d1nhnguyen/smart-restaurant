import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderItemStatus } from '@prisma/client';
import { OrdersGateway } from '../gateway/orders.gateway';

@Injectable()
export class KitchenService {
  constructor(
    private prisma: PrismaService,
    private ordersGateway: OrdersGateway,
  ) {}

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
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: {
            selectedModifiers: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order không tồn tại');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.READY,
      },
      include: {
        table: true,
        items: {
          include: {
            selectedModifiers: true,
          },
        },
      },
    });

    // Emit WebSocket events
    this.ordersGateway.emitOrderStatusUpdated(orderId, OrderStatus.READY, updatedOrder);
    this.ordersGateway.emitOrderReady(orderId, updatedOrder);

    return updatedOrder;
  }

  // Đánh dấu từng Item là READY (Optional)
  async markItemReady(orderId: string, itemId: string) {
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId, orderId: orderId },
      data: { 
        status: OrderItemStatus.READY,
        preparedAt: new Date(),
      },
    });

    // Emit WebSocket event for item status update
    this.ordersGateway.emitOrderItemStatusUpdated(orderId, itemId, OrderItemStatus.READY);

    return updatedItem;
  };
} 
