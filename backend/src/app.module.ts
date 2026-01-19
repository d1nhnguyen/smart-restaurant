import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './tables/tables.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { AppController } from './app.controller';
import { KitchenModule } from './kitchen/kitchen.module';
import { PaymentsModule } from './payments/payments.module';
import { GatewayModule } from './gateway/gateway.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TablesModule,
    MenuModule,
    AuthModule,
    OrdersModule,
    KitchenModule,
    PaymentsModule,
    GatewayModule,
    AnalyticsModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
