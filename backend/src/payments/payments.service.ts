import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: CreatePaymentDto) {
    // Kiểm tra order tồn tại
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order không tồn tại');

    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Giao dịch không tồn tại');

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái Payment thành PAID
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { 
          status: PaymentStatus.PAID,
          paidAt: new Date() 
        },
      });

      // 2. Cập nhật trạng thái Order thành COMPLETED
      await tx.order.update({
        where: { id: payment.orderId },
        data: { 
          status: OrderStatus.COMPLETED,
          completedAt: new Date()
        },
      });

      return updatedPayment;
    });
  }

  async getPaymentsByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}