import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesExportService } from './tables-export.service';
import { QrService } from '../qr/qr.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly qrService: QrService,
    private readonly tablesExportService: TablesExportService,
  ) {}

  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  // API 1: Tải tất cả QR code (ZIP)
  // Đặt endpoint này TRƯỚC @Get(':id') để tránh bị nhầm 'qr/download-all' là một cái id
  @Get('qr/download-all')
  @Header('Content-Type', 'application/zip')
  async downloadAllZip(@Res({ passthrough: true }) res): Promise<StreamableFile> {
    try {
      // Lấy tất cả bàn từ DB
      const tables = await this.tablesService.findAll({}); 
      // Gọi service export để nén zip
      const { stream, filename } = await this.tablesExportService.generateAllQrsZip(tables);
      
      res.set({
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      
      return new StreamableFile(stream);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      throw error;
    }
  }

  // API 2: Tải PDF của 1 bàn
  @Get(':id/qr/download')
  @Header('Content-Type', 'application/pdf')
  async downloadTablePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    try {
      // Lấy thông tin bàn từ DB
      const table = await this.tablesService.findOne(id);
      // Gọi service export để tạo PDF
      const { stream, filename } = await this.tablesExportService.generateTablePdf(table);
      
      res.set({
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      
      return new StreamableFile(stream);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
  
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.tablesService.findAll({ status, location, sortBy });
  }

  @Get('locations')
  getLocations() {
    return this.tablesService.getLocations();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.tablesService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }

  // QR Code Endpoints

  /**
   * Bulk regenerate QR codes for all active tables
   * POST /tables/qr/regenerate-all
   * MUST BE BEFORE :id routes to avoid conflict
   */
  @Post('qr/regenerate-all')
  async regenerateAllQr() {
    const tables = await this.tablesService.findAll({ status: 'ACTIVE' });
    let regeneratedCount = 0;
    
    for (const table of tables) {
      try {
        await this.qrService.regenerateQrToken(table.id);
        regeneratedCount++;
      } catch (error) {
        console.error(`Failed to regenerate QR for table ${table.id}:`, error);
      }
    }
    
    return {
      success: true,
      regeneratedCount,
      totalTables: tables.length,
      message: `Successfully regenerated ${regeneratedCount} out of ${tables.length} QR codes`,
    };
  }

  /**
   * Generate QR token for a table
   * POST /tables/:id/qr/generate
   */
  @Post(':id/qr/generate')
  generateQr(@Param('id') id: string) {
    return this.qrService.generateQrToken(id);
  }

  /**
   * Regenerate QR token for a table (invalidates old token)
   * POST /tables/:id/qr/regenerate
   */
  @Post(':id/qr/regenerate')
  regenerateQr(@Param('id') id: string) {
    return this.qrService.regenerateQrToken(id);
  }

  /**
   * Get table with QR URL
   * GET /tables/:id/qr
   */
  @Get(':id/qr')
  getTableQr(@Param('id') id: string) {
    return this.qrService.getTableWithQrUrl(id);
  }
}
