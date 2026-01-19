import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { QrModule } from '../qr/qr.module';
import { TablesExportService } from './tables-export.service';
import { GatewayModule } from '../gateway/gateway.module';
@Module({
  imports: [QrModule, GatewayModule,],
  controllers: [TablesController],
  providers: [TablesService, TablesExportService],
  exports: [TablesService],
})
export class TablesModule {}
