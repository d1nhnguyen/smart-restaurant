import { Controller, Post, Get, Body, Param, Query, Ip, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateVNPayPaymentDto } from './dto/create-vnpay-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Get(':orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsByOrder(orderId);
  }

  // VNPay endpoints
  @Post('vnpay/create')
  createVNPayPayment(@Body() dto: CreateVNPayPaymentDto, @Ip() ipAddress: string) {
    return this.paymentsService.createVNPayPayment(dto, ipAddress);
  }

  // POST endpoint for frontend to send VNPay callback data
  @Post('vnpay-return')
  async vnpayReturnPost(@Body() body: any) {
    const rawQueryString = body.rawQueryString;

    console.log('\n=== Raw VNPay Query String ===');
    console.log(rawQueryString);
    console.log('==============================\n');

    // Parse params for data extraction (but use raw string for signature)
    const params: any = {};
    rawQueryString.split('&').forEach((pair: string) => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });

    // Pass both raw string and parsed params
    const result = await this.paymentsService.handleVNPayReturnRaw(rawQueryString, params);
    return result;
  }

  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentsService.handleVNPayReturn(query);

    // Redirect to frontend with result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    if (result.success) {
      return res.redirect(`${frontendUrl}/payment/success?orderId=${result.data.orderId}&amount=${result.data.amount}&transactionNo=${result.data.transactionNo}`);
    } else {
      return res.redirect(`${frontendUrl}/payment/failed?code=${result.code}&message=${encodeURIComponent(result.message)}`);
    }
  }

  @Post('vnpay-ipn')
  vnpayIPN(@Query() query: any) {
    return this.paymentsService.handleVNPayIPN(query);
  }
}