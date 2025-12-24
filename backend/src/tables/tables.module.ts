import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { QrModule } from '../qr/qr.module';
import { TablesExportService } from './tables-export.service';

@Module({
  imports: [QrModule],
  controllers: [TablesController],
  providers: [TablesService, TablesExportService],
  exports: [TablesService],
})
export class TablesModule {}
