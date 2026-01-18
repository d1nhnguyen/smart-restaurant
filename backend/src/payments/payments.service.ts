import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateVNPayPaymentDto } from './dto/create-vnpay-payment.dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { VNPayService } from './vnpay/vnpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private vnpayService: VNPayService,
  ) { }

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

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID
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

  // VNPay methods
  async createVNPayPayment(dto: CreateVNPayPaymentDto, ipAddress: string) {
    const { orderId, amount, orderInfo, bankCode, language } = dto;

    // Kiểm tra order tồn tại
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order không tồn tại');

    // Tạo payment record với status PENDING
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        // Don't set transactionId yet - will be updated from VNPay callback
      },
    });

    // Tạo VNPay payment URL
    const paymentUrl = this.vnpayService.createPaymentUrl(
      orderId,
      amount,
      orderInfo,
      ipAddress,
      bankCode,
      language,
    );

    return {
      paymentId: payment.id,
      paymentUrl,
    };
  }

  // Handle VNPay return with raw query string
  async handleVNPayReturnRaw(rawQueryString: string, parsedParams: any) {
    const result = this.vnpayService.verifyReturnUrlRaw(rawQueryString, parsedParams);

    if (!result.success) {
      return result;
    }

    // Update payment and order
    const orderId = result.data.orderId;
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return {
        success: false,
        code: '01',
        message: 'Payment record not found',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionId: result.data.transactionNo,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    });

    return result;
  }

  async handleVNPayReturn(query: any) {
    const result = this.vnpayService.verifyReturnUrl(query);

    if (!result.success) {
      return result;
    }

    // Tìm payment và order
    const orderId = result.data.orderId;
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return {
        success: false,
        code: '01',
        message: 'Payment record not found',
      };
    }

    // Cập nhật payment và order status
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionId: result.data.transactionNo,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    });

    return result;
  }

  async handleVNPayIPN(query: any) {
    const verifyResult = this.vnpayService.verifyIpnUrl(query);

    if (!verifyResult.isValid) {
      return {
        RspCode: '97',
        Message: 'Invalid signature',
      };
    }

    const orderId = verifyResult.orderId;
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        method: PaymentMethod.VNPAY,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return {
        RspCode: '01',
        Message: 'Order not found',
      };
    }

    // Kiểm tra nếu đã được xử lý rồi
    if (payment.status === PaymentStatus.PAID) {
      return {
        RspCode: '02',
        Message: 'Order already confirmed',
      };
    }

    // Cập nhật payment status nếu payment thành công
    if (verifyResult.responseCode === '00') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });
      });

      return {
        RspCode: '00',
        Message: 'Confirm Success',
      };
    } else {
      return {
        RspCode: verifyResult.responseCode,
        Message: 'Payment failed',
      };
    }
  }
}