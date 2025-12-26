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
  UseGuards,
  UsePipes,
  ValidationPipe,
  Put,
} from '@nestjs/common';
import { QrService } from '../qr/qr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MenuCategoryService } from './menu-category.service';
import { MenuItemService } from './menu-item.service';
import { ModifierGroupService } from './modifier-group.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-item.dto';
import { UpdateMenuItemDto } from './dto/update-item.dto';
import { GetItemsFilterDto } from './dto/get-items.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { AttachModifierGroupsDto } from './dto/attach-modifier-groups.dto';

@Controller('') // Đổi thành Root để định nghĩa path linh hoạt cho cả Guest và Admin
export class MenuController {
  constructor(
    private readonly qrService: QrService, // Giữ nguyên code cũ
    private readonly categoryService: MenuCategoryService, // Inject thêm service Admin
    private readonly itemService: MenuItemService,         // Inject thêm service Admin
    private readonly modifierGroupService: ModifierGroupService, // Inject modifier service
  ) {}

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

  // --- Modifier Group Endpoints ---

  @Get('admin/menu/modifier-groups')
  findAllModifierGroups() {
    return this.modifierGroupService.findAll(this.getAdminRestaurantId());
  }

  @Get('admin/menu/modifier-groups/:id')
  findOneModifierGroup(@Param('id') id: string) {
    return this.modifierGroupService.findOne(id, this.getAdminRestaurantId());
  }

  @Post('admin/menu/modifier-groups')
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.modifierGroupService.create(this.getAdminRestaurantId(), dto);
  }

  @Put('admin/menu/modifier-groups/:id')
  updateModifierGroup(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifierGroupService.update(id, this.getAdminRestaurantId(), dto);
  }

  @Delete('admin/menu/modifier-groups/:id')
  removeModifierGroup(@Param('id') id: string) {
    return this.modifierGroupService.remove(id, this.getAdminRestaurantId());
  }

  // --- Modifier Option Endpoints ---

  @Post('admin/menu/modifier-groups/:id/options')
  createModifierOption(@Param('id') groupId: string, @Body() dto: CreateModifierOptionDto) {
    return this.modifierGroupService.createOption(groupId, this.getAdminRestaurantId(), dto);
  }

  @Put('admin/menu/modifier-options/:id')
  updateModifierOption(@Param('id') optionId: string, @Body() dto: UpdateModifierOptionDto) {
    return this.modifierGroupService.updateOption(optionId, this.getAdminRestaurantId(), dto);
  }

  @Delete('admin/menu/modifier-options/:id')
  removeModifierOption(@Param('id') optionId: string) {
    return this.modifierGroupService.removeOption(optionId, this.getAdminRestaurantId());
  }

  // --- Attach/Detach Modifier Groups to Items ---

  @Post('admin/menu/items/:id/modifier-groups')
  attachModifierGroupsToItem(@Param('id') itemId: string, @Body() dto: AttachModifierGroupsDto) {
    return this.modifierGroupService.attachGroupsToItem(itemId, this.getAdminRestaurantId(), dto.groupIds);
  }
}