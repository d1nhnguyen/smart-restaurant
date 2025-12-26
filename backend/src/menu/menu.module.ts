import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { QrModule } from '../qr/qr.module';
import { MenuCategoryService } from './menu-category.service';
import { MenuItemService } from './menu-item.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [QrModule, PrismaModule],
  controllers: [MenuController],
  providers: [
    MenuCategoryService,
    MenuItemService,
  ],
  exports: [MenuCategoryService, MenuItemService],
})
export class MenuModule {}
