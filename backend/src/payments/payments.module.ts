import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Cần thiết vì PaymentsService sử dụng PrismaService
  controllers: [PaymentsController], // Đăng ký Controller để nhận request
  providers: [PaymentsService], // Đăng ký Service để xử lý logic
  exports: [PaymentsService], // Export nếu các module khác cần sử dụng logic thanh toán
})
export class PaymentsModule {}