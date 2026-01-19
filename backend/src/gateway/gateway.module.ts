import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class GatewayModule {}
