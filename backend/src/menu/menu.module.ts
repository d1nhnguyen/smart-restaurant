import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [QrModule],
  controllers: [MenuController],
})
export class MenuModule {}
