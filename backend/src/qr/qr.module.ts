import { Module } from '@nestjs/common';
import { QrService } from './qr.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
