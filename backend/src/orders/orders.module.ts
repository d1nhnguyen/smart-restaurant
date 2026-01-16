import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [PrismaModule, GatewayModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
