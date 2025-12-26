import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UnauthorizedException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QrService } from '../qr/qr.service';
// --- Import mới ---
import { MenuCategoryService } from './menu-category.service';
import { MenuItemService } from './menu-item.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-item.dto';
import { UpdateMenuItemDto } from './dto/update-item.dto';
import { GetItemsFilterDto } from './dto/get-items.dto';
import { UpdateStatusDto } from './dto/update-status.dto'; // Đảm bảo bạn đã tạo file này

@Controller('') // Đổi thành Root để định nghĩa path linh hoạt cho cả Guest và Admin
export class MenuController {
  constructor(
    private readonly qrService: QrService, // Giữ nguyên code cũ
    private readonly categoryService: MenuCategoryService, // Inject thêm service Admin
    private readonly itemService: MenuItemService,         // Inject thêm service Admin
  ) {}

  // ==================================================================
  // PHẦN 1: GUEST MENU (CODE CŨ - GIỮ NGUYÊN LOGIC)
  // Đường dẫn: /api/menu
  // ==================================================================

  @Get('menu') // Chuyển 'menu' xuống đây
  async getMenu(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required. Please scan the QR code again.');
    }

    const result = await this.qrService.verifyQrToken(token);

    if (!result.valid) {
      throw new UnauthorizedException(result.error || 'Invalid or expired token');
    }

    // Lấy danh sách Categories & Items thực tế từ Database (Nâng cấp code cũ)
    const restaurantId = result.table.restaurantId; // Giả sử trong table có restaurantId
    // Nếu table chưa có restaurantId, bạn có thể hardcode tạm hoặc lấy items mẫu như cũ
    
    // Code cũ của bạn trả về data mẫu, bạn có thể giữ nguyên hoặc gọi service thật:
    // const categories = await this.categoryService.findAll(restaurantId);
    
    return {
      success: true,
      table: result.table,
      message: `Welcome to Table ${result.table.tableNumber}!`,
      // Giữ lại data mẫu của bạn để không làm hỏng app cũ, hoặc thay bằng data thật
      menuItems: [
        { id: '1', name: 'Grilled Salmon', price: 18.00, available: true },
        // ... (data mẫu cũ)
      ],
    };
  }

  @Get('menu/verify') // Chuyển path cũ
  async verifyToken(@Query('token') token: string) {
    if (!token) return { valid: false, error: 'Token is required' };
    return this.qrService.verifyQrToken(token);
  }

  // ==================================================================
  // PHẦN 2: ADMIN MANAGEMENT (CODE MỚI - BỔ SUNG)
  // Đường dẫn: /api/admin/menu/...
  // ==================================================================

  // Helper: Mock ID (Thay bằng User Decorator khi có Auth)
  private getAdminRestaurantId() {
    return '123e4567-e89b-12d3-a456-426614174000'; 
  }

  // --- Category Endpoints ---

  @Get('admin/menu/categories')
  findAllCategories() {
    return this.categoryService.findAll(this.getAdminRestaurantId());
  }

  @Post('admin/menu/categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(this.getAdminRestaurantId(), dto);
  }

  @Patch('admin/menu/categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, this.getAdminRestaurantId(), dto);
  }

  @Patch('admin/menu/categories/:id/status')
  updateCategoryStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.categoryService.updateStatus(id, this.getAdminRestaurantId(), dto.status);
  }

  // --- Item Endpoints ---

  @Get('admin/menu/items')
  @UsePipes(new ValidationPipe({ transform: true }))
  findAllItems(@Query() query: GetItemsFilterDto) {
    return this.itemService.findAll(this.getAdminRestaurantId(), query);
  }

  @Get('admin/menu/items/:id')
  findOneItem(@Param('id') id: string) {
    return this.itemService.findOne(id, this.getAdminRestaurantId());
  }

  @Post('admin/menu/items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.itemService.create(this.getAdminRestaurantId(), dto);
  }

  @Patch('admin/menu/items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.itemService.update(id, this.getAdminRestaurantId(), dto);
  }

  @Delete('admin/menu/items/:id')
  removeItem(@Param('id') id: string) {
    return this.itemService.remove(id, this.getAdminRestaurantId());
  }
}