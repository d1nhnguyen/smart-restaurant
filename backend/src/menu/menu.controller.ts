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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QrService } from '../qr/qr.service';
import { MenuCategoryService } from './menu-category.service';
import { MenuItemService } from './menu-item.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-item.dto';
import { UpdateMenuItemDto } from './dto/update-item.dto';
import { GetItemsFilterDto } from './dto/get-items.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { multerOptions } from '../utils/file-upload.utils';

@Controller('')
export class MenuController {
  constructor(
    private readonly qrService: QrService,
    private readonly categoryService: MenuCategoryService,
    private readonly itemService: MenuItemService,
  ) { }

  // ==================================================================
  // --- GUEST MENU ENDPOINTS ---
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

    const restaurantId = result.table.restaurantId;

    // Fetch categories and items from database
    const categories = await this.categoryService.findAll(restaurantId);

    // Lấy tất cả items có ảnh kèm theo
    const items = await this.itemService.findAll(restaurantId, {
      page: 1,
      limit: 1000, // Lấy hết để group 
      status: 'AVAILABLE' as any,
    });

    return {
      success: true,
      table: result.table,
      message: `Welcome to Table ${result.table.tableNumber}!`,
      categories,
      menuItems: items.data,
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

  // ==================================================================
  // --- PHOTO MANAGEMENT ENDPOINTS ---
  // ==================================================================

  @Post('admin/menu/items/:id/photos')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.itemService.addPhotos(id, this.getAdminRestaurantId(), files);
  }

  @Delete('admin/menu/items/:id/photos/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.itemService.removePhoto(id, photoId, this.getAdminRestaurantId());
  }

  @Patch('admin/menu/items/:id/photos/:photoId/primary')
  async setPrimaryPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.itemService.setPrimaryPhoto(id, photoId, this.getAdminRestaurantId());
  }
}
