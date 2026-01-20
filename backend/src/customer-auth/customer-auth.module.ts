import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { CustomerJwtAuthGuard } from './customer-jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerJwtStrategy, CustomerJwtAuthGuard],
  exports: [CustomerAuthService, CustomerJwtAuthGuard],
})
export class CustomerAuthModule {}
