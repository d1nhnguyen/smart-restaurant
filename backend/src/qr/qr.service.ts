import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

export interface QrTokenPayload {
  tableId: string;
  tableNumber: string;
  timestamp: number;
}

@Injectable()
export class QrService {
  private readonly qrSecret: string;
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.qrSecret = this.configService.get<string>('QR_TOKEN_SECRET') || 'qr-secret-key-change-this-in-production';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';
  }

  /**
   * Generate a new QR token for a table
   */
  async generateQrToken(tableId: string): Promise<{ token: string; qrUrl: string; sessionId: string }> {
    // Check if table exists
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payload with sessionId
    const payload: QrTokenPayload = {
      tableId: table.id,
      tableNumber: table.tableNumber,
      timestamp: Date.now(),
    };

    // Sign the token
    const token = jwt.sign(payload, this.qrSecret, {
      expiresIn: '365d', // Token valid for 1 year, but can be invalidated by regenerating
    });

    // Save token AND sessionId to database
    await this.prisma.table.update({
      where: { id: tableId },
      data: {
        qrToken: token,
        currentSessionId: sessionId
      },
    });

    // Generate QR URL - Point to landing page for validation and context setup
    const qrUrl = `${this.frontendUrl}/table/${tableId}?token=${token}`;

    console.log(`✅ Generated new QR session ${sessionId} for table ${table.tableNumber}`);

    return { token, qrUrl, sessionId };
  }

  /**
   * Regenerate QR token for a table (invalidates old token)
   */
  async regenerateQrToken(tableId: string): Promise<{ token: string; qrUrl: string }> {
    // Simply generate a new token - the old one becomes invalid because
    // we compare against the token stored in the database
    return this.generateQrToken(tableId);
  }

  /**
   * Verify QR token and return table information
   */
  async verifyQrToken(token: string): Promise<{ valid: boolean; table?: any; error?: string }> {
    try {
      // Decode and verify the token
      const decoded = jwt.verify(token, this.qrSecret) as QrTokenPayload;

      // Find the table
      const table = await this.prisma.table.findUnique({
        where: { id: decoded.tableId },
      });

      if (!table) {
        return { valid: false, error: 'Table not found' };
      }

      // Check if the token matches the one stored in the database
      if (table.qrToken !== token) {
        return { valid: false, error: 'Token has been invalidated. Please scan the new QR code.' };
      }

      // Check if table is active
      if (table.status === 'INACTIVE') {
        return { valid: false, error: 'This table is currently inactive' };
      }

      return {
        valid: true,
        table: {
          id: table.id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          location: table.location,
          sessionId: table.currentSessionId, // Return current session ID
          restaurantName: 'Smart Restaurant',
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'QR code has expired. Please ask staff for assistance.' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid QR code' };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Get table with QR URL
   */
  async getTableWithQrUrl(tableId: string): Promise<any> {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    let qrUrl = null;
    if (table.qrToken) {
      qrUrl = `${this.frontendUrl}/table/${tableId}`;
    }

    return {
      ...table,
      qrUrl,
    };
  }
}
