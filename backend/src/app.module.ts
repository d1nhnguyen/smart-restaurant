import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './tables/tables.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { AppController } from './app.controller';
import { KitchenModule } from './kitchen/kitchen.module';

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
  ],
  controllers: [AppController],
})
export class AppModule { }
