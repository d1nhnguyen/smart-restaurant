// src/tables/tables-export.service.ts
import { Injectable, StreamableFile } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import * as archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class TablesExportService {
  
  // Helper: Tạo URL
  // Lưu ý: Đảm bảo field token khớp với database (thường Prisma trả về camelCase là qrToken)
  private generateQrUrl(tableId: string, token: string | null): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const safeToken = token || 'no-token';
    return `${baseUrl}/menu?table=${tableId}&token=${safeToken}`;
  }

  // --- Feature: PDF 1 Bàn ---
  async generateTablePdf(table: any): Promise<{ stream: Readable; filename: string }> {
    // Tạo PDF A6 với auto page tắt để kiểm soát hoàn toàn
    const doc = new PDFDocument({ 
      size: 'A6', 
      margin: 15,
      autoFirstPage: false 
    }); 
    
    doc.addPage();
    
    const qrUrl = this.generateQrUrl(table.id, table.qrToken); 
    const qrBuffer = await QRCode.toBuffer(qrUrl, { scale: 5 });

    let yPos = 30; // Vị trí bắt đầu từ trên xuống
    
    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(`TABLE ${table.tableNumber}`, 0, yPos, { 
      align: 'center',
      width: doc.page.width
    });
    
    yPos += 30; // Di chuyển xuống cho QR
    
    // QR Code căn giữa
    const qrSize = 110;
    const qrX = (doc.page.width - qrSize) / 2;
    doc.image(qrBuffer, qrX, yPos, { width: qrSize, height: qrSize, fit: [qrSize, qrSize] });
    
    // Tính toán vị trí footer trong cùng trang
    yPos += qrSize + 8;
    
    // Footer - đảm bảo không bị xuống trang mới
    if (yPos < doc.page.height - 40) {
      doc.fontSize(10).font('Helvetica').text('Scan to Order', 0, yPos, {
        align: 'center',
        width: doc.page.width
      });
    }
    
    doc.end();
    
    return {
      stream: doc as unknown as Readable,
      filename: `Table-${table.tableNumber}.pdf`,
    };
  }

  // --- Feature: ZIP tất cả bàn ---
  async generateAllQrsZip(tables: any[]): Promise<{ stream: Readable; filename: string }> {
    const archive = archiver('zip', { zlib: { level: 9 } });

    for (const table of tables) {
      // SỬA: Dùng qrToken
      if (table.qrToken) {
        const qrUrl = this.generateQrUrl(table.id, table.qrToken);
        const qrBuffer = await QRCode.toBuffer(qrUrl);
        
        // Thêm vào zip - SỬA: Dùng tableNumber
        archive.append(qrBuffer, { name: `Table-${table.tableNumber}.png` });
      }
    }

    archive.finalize();
    
    return {
      stream: archive,
      filename: 'All-Tables-QR.zip',
    };
  }
}
