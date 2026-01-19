import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-item.dto';
import { UpdateMenuItemDto } from './dto/update-item.dto';
import { GetItemsFilterDto, ItemSort } from './dto/get-items.dto';
import { Prisma, ItemStatus } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';


@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateMenuItemDto) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const { categoryId, ...itemData } = dto;

    return this.prisma.menuItem.create({
      data: {
        ...itemData,
        status: dto.status || ItemStatus.AVAILABLE,
        category: {
          connect: { id: categoryId }
        }
      },
    });
  }

  async findAll(query: GetItemsFilterDto) {
    const { page, limit, search, categoryId, status, sort } = query;
    const skip = (page - 1) * limit;

    // Build Where Clause - simple contains search for backend
    const where: Prisma.MenuItemWhereInput = {
      isDeleted: false,
      categoryId: categoryId || undefined,
      status: status || undefined,
      name: search ? { contains: search, mode: 'insensitive' } : undefined,
    };

    // Build Order Clause
    let orderBy: Prisma.MenuItemOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case ItemSort.PRICE_ASC: orderBy = { price: 'asc' }; break;
      case ItemSort.PRICE_DESC: orderBy = { price: 'desc' }; break;
      case ItemSort.STATUS_ASC: orderBy = { status: 'asc' }; break;
      case ItemSort.STATUS_DESC: orderBy = { status: 'desc' }; break;
      case ItemSort.NAME_ASC: orderBy = { name: 'asc' }; break;
      case ItemSort.NAME_DESC: orderBy = { name: 'desc' }; break;
    }

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true } },
          photos: {
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' },
              { createdAt: 'asc' }
            ]
          },
          modifierGroups: {
            where: {
              group: { status: 'ACTIVE' },
            },
            include: {
              group: {
                include: {
                  options: {
                    where: { status: 'ACTIVE' },
                    orderBy: { createdAt: 'asc' },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        photos: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id); // Check exist
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check exist

    // Soft Delete: Giữ lại data cho lịch sử order
    return this.prisma.menuItem.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // --- Photo Management Logic ---

  async addPhotos(itemId: string, files: Express.Multer.File[]) {
    // 1. Check item exists
    await this.findOne(itemId);

    // 2. Create photo records
    const photos = await Promise.all(
      files.map((file) =>
        this.prisma.menuItemPhoto.create({
          data: {
            menuItemId: itemId,
            url: `/uploads/menu-items/${file.filename}`,
            isPrimary: false, // Default false, admin can set primary later
          },
        }),
      ),
    );

    return {
      success: true,
      count: photos.length,
      photos,
    };
  }

  async removePhoto(itemId: string, photoId: string) {
    // 1. Check item ownership
    await this.findOne(itemId);

    // 2. Find photo
    const photo = await this.prisma.menuItemPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.menuItemId !== itemId) {
      throw new NotFoundException('Photo not found');
    }

    // 3. Delete from DB
    await this.prisma.menuItemPhoto.delete({
      where: { id: photoId },
    });

    // 4. Physical file deletion
    try {
      // url looks like "/uploads/menu-items/abc.jpg"
      // we need relative path from project root: "./uploads/menu-items/abc.jpg"
      const filePath = join(__dirname, '../../..', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete physical file: ${photo.url}`, err);
      // We don't throw here to ensure the API call still succeeds if DB delete worked
    }

    return { success: true, message: 'Photo removed successfully and file deleted' };
  }

  async setPrimaryPhoto(itemId: string, photoId: string) {
    // 1. Check ownership
    await this.findOne(itemId);

    // 2. Verify photo exists
    const photo = await this.prisma.menuItemPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.menuItemId !== itemId) {
      throw new NotFoundException('Photo not found');
    }

    // 3. Set all other photos for this item to NOT primary
    await this.prisma.menuItemPhoto.updateMany({
      where: { menuItemId: itemId },
      data: { isPrimary: false },
    });

    // 4. Set this photo to primary
    return this.prisma.menuItemPhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });
  }

  async getTableById(id: string) {
    return this.prisma.table.findUnique({ where: { id } });
  }
}
