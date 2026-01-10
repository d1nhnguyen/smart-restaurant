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
  Put,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { multerOptions } from '../utils/file-upload.utils';

@Controller('') // Đổi thành Root để định nghĩa path linh hoạt cho cả Guest và Admin
export class MenuController {
  constructor(
    private readonly qrService: QrService, // Giữ nguyên code cũ
    private readonly categoryService: MenuCategoryService, // Inject thêm service Admin
    private readonly itemService: MenuItemService,         // Inject thêm service Admin
    private readonly modifierGroupService: ModifierGroupService, // Inject modifier service
  ) { }

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
  // ==================================================================
  // PHẦN 1: GUEST MENU (CODE CŨ - GIỮ NGUYÊN LOGIC)
  // Đường dẫn: /api/menu
  // ==================================================================

  @Get('menu')
  async getMenu(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required. Please scan the QR code again.');
    }

    const result = await this.qrService.verifyQrToken(token);

    if (!result.valid) {
      throw new UnauthorizedException(result.error || 'Invalid or expired token');
    }

    // Lấy tất cả categories và chỉ giữ lại những category ACTIVE
    const allCategories = await this.categoryService.findAll();
    const activeCategories = allCategories.filter(cat => cat.status === 'ACTIVE');
    const activeCategoryIds = activeCategories.map(c => c.id);

    // Lấy tất cả items có ảnh kèm theo
    const items = await this.itemService.findAll({
      page: 1,
      limit: 1000, // Lấy hết để group 
      status: 'AVAILABLE' as any,
    });

    // Chỉ giữ lại items thuộc về categories ACTIVE
    const activeItems = items.data.filter(item =>
      activeCategoryIds.includes(item.categoryId)
    );

    return {
      success: true,
      table: result.table,
      message: `Welcome to Table ${result.table.tableNumber}!`,
      categories: activeCategories,
      menuItems: activeItems,
    };
  }

  @Get('menu/verify')
  async verifyToken(@Query('token') token: string) {
    if (!token) return { valid: false, error: 'Token is required' };
    return this.qrService.verifyQrToken(token);
  }

  // ==================================================================
  // --- ADMIN MANAGEMENT ENDPOINTS ---
  // ==================================================================

  // --- Category Endpoints ---

  @Get('admin/menu/categories')
  findAllCategories() {
    return this.categoryService.findAll();
  }

  @Post('admin/menu/categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch('admin/menu/categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Patch('admin/menu/categories/:id/status')
  updateCategoryStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.categoryService.updateStatus(id, dto.status);
  }

  // --- Item Endpoints ---

  @Get('admin/menu/items')
  @UsePipes(new ValidationPipe({ transform: true }))
  findAllItems(@Query() query: GetItemsFilterDto) {
    return this.itemService.findAll(query);
  }

  @Get('admin/menu/items/:id')
  findOneItem(@Param('id') id: string) {
    return this.itemService.findOne(id);
  }

  @Post('admin/menu/items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.itemService.create(dto);
  }

  @Patch('admin/menu/items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.itemService.update(id, dto);
  }

  @Delete('admin/menu/items/:id')
  removeItem(@Param('id') id: string) {
    return this.itemService.remove(id);
  }

  // --- Modifier Group Endpoints ---

  @Get('admin/menu/modifier-groups')
  findAllModifierGroups() {
    return this.modifierGroupService.findAll();
  }

  @Get('admin/menu/modifier-groups/:id')
  findOneModifierGroup(@Param('id') id: string) {
    return this.modifierGroupService.findOne(id);
  }

  @Post('admin/menu/modifier-groups')
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.modifierGroupService.create(dto);
  }

  @Put('admin/menu/modifier-groups/:id')
  updateModifierGroup(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifierGroupService.update(id, dto);
  }

  @Delete('admin/menu/modifier-groups/:id')
  removeModifierGroup(@Param('id') id: string) {
    return this.modifierGroupService.remove(id);
  }

  // --- Modifier Option Endpoints ---

  @Post('admin/menu/modifier-groups/:id/options')
  createModifierOption(@Param('id') groupId: string, @Body() dto: CreateModifierOptionDto) {
    return this.modifierGroupService.createOption(groupId, dto);
  }

  @Put('admin/menu/modifier-options/:id')
  updateModifierOption(@Param('id') optionId: string, @Body() dto: UpdateModifierOptionDto) {
    return this.modifierGroupService.updateOption(optionId, dto);
  }

  @Delete('admin/menu/modifier-options/:id')
  removeModifierOption(@Param('id') optionId: string) {
    return this.modifierGroupService.removeOption(optionId);
  }

  // --- Attach/Detach Modifier Groups to Items ---

  @Post('admin/menu/items/:id/modifier-groups')
  attachModifierGroupsToItem(@Param('id') itemId: string, @Body() dto: AttachModifierGroupsDto) {
    return this.modifierGroupService.attachGroupsToItem(itemId, dto.groupIds);
  }

  // ==================================================================
  // --- PHOTO MANAGEMENT ENDPOINTS ---
  // ==================================================================

  @Post('admin/menu/items/:id/photos')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.itemService.addPhotos(id, files);
  }

  @Delete('admin/menu/items/:id/photos/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.itemService.removePhoto(id, photoId);
  }

  @Patch('admin/menu/items/:id/photos/:photoId/primary')
  async setPrimaryPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.itemService.setPrimaryPhoto(id, photoId);
  }
}


