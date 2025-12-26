import {
  Controller,
  Get,
  Query,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { QrService } from '../qr/qr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly qrService: QrService) {}

  /**
   * Admin endpoint to view all menu items (requires authentication)
   * GET /api/menu/admin
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminMenu() {
    return {
      success: true,
      menuItems: [
        {
          id: '1',
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon grilled to perfection',
          price: 18.00,
          category: 'Main Dishes',
          available: true,
        },
        {
          id: '2',
          name: 'Caesar Salad',
          description: 'Classic Caesar salad with homemade dressing',
          price: 12.00,
          category: 'Appetizers',
          available: true,
        },
        {
          id: '3',
          name: 'Beef Steak',
          description: 'Premium beef steak cooked to your preference',
          price: 25.00,
          category: 'Main Dishes',
          available: false,
        },
        {
          id: '4',
          name: 'Pasta Carbonara',
          description: 'Creamy pasta with bacon and parmesan',
          price: 15.00,
          category: 'Main Dishes',
          available: true,
        },
        {
          id: '5',
          name: 'Mushroom Soup',
          description: 'Rich and creamy mushroom soup',
          price: 8.00,
          category: 'Appetizers',
          available: true,
        },
      ],
    };
  }

  /**
   * Public endpoint for customers to access menu via QR code
   * GET /api/menu?token=...
   */
  @Get()
  async getMenu(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required. Please scan the QR code again.');
    }

    const result = await this.qrService.verifyQrToken(token);

    if (!result.valid) {
      throw new UnauthorizedException(result.error || 'Invalid or expired token');
    }

    // Return table info and menu data
    // In a full implementation, you would also return menu items here
    return {
      success: true,
      table: result.table,
      message: `Welcome to Table ${result.table.tableNumber}!`,
      // In the future, you can add:
      // menu: await this.menuService.getActiveMenuItems(),
      menuItems: [
        // Sample menu items for demonstration
        {
          id: '1',
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon grilled to perfection',
          price: 18.00,
          category: 'Main Dishes',
          available: true,
        },
        {
          id: '2',
          name: 'Caesar Salad',
          description: 'Classic Caesar salad with homemade dressing',
          price: 12.00,
          category: 'Appetizers',
          available: true,
        },
        {
          id: '3',
          name: 'Beef Steak',
          description: 'Premium beef steak cooked to your preference',
          price: 25.00,
          category: 'Main Dishes',
          available: false,
        },
        {
          id: '4',
          name: 'Pasta Carbonara',
          description: 'Creamy pasta with bacon and parmesan',
          price: 15.00,
          category: 'Main Dishes',
          available: true,
        },
        {
          id: '5',
          name: 'Mushroom Soup',
          description: 'Rich and creamy mushroom soup',
          price: 8.00,
          category: 'Appetizers',
          available: true,
        },
      ],
    };
  }

  /**
   * Verify token endpoint (for frontend to check if token is valid)
   * GET /api/menu/verify?token=...
   */
  @Get('verify')
  async verifyToken(@Query('token') token: string) {
    if (!token) {
      return { valid: false, error: 'Token is required' };
    }

    return this.qrService.verifyQrToken(token);
  }
}
