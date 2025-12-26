import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-item.dto';
import { UpdateMenuItemDto } from './dto/update-item.dto';
import { GetItemsFilterDto, ItemSort } from './dto/get-items.dto';
import { Prisma, ItemStatus } from '@prisma/client';


@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateMenuItemDto) {
  const category = await this.prisma.menuCategory.findFirst({
    where: { id: dto.categoryId, restaurantId },
  });
  if (!category) throw new NotFoundException('Category not found');

  const { categoryId, ...itemData } = dto;

  return this.prisma.menuItem.create({
    data: {
      ...itemData,
      restaurantId,
      status: dto.status || ItemStatus.AVAILABLE,
      category: {
        connect: { id: categoryId }
      }
    },
  });
}

  async findAll(restaurantId: string, query: GetItemsFilterDto) {
    const { page, limit, search, categoryId, status, sort } = query;
    const skip = (page - 1) * limit;

    // Build Where Clause
    const where: Prisma.MenuItemWhereInput = {
      restaurantId,
      isDeleted: false, // Chỉ lấy item chưa bị xóa
      categoryId: categoryId || undefined,
      status: status || undefined,
      name: search ? { contains: search, mode: 'insensitive' } : undefined,
    };

    // Build Order Clause
    let orderBy: Prisma.MenuItemOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
        case ItemSort.PRICE_ASC: orderBy = { price: 'asc' }; break;
        case ItemSort.PRICE_DESC: orderBy = { price: 'desc' }; break;
        case ItemSort.OLDEST: orderBy = { createdAt: 'asc' }; break;
    }

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { category: { select: { name: true } } }, // Join lấy tên category
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

  async findOne(id: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId, isDeleted: false },
      include: { category: true }
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuItemDto) {
    await this.findOne(id, restaurantId); // Check exist
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, restaurantId: string) {
    await this.findOne(id, restaurantId); // Check exist
    
    // Soft Delete: Giữ lại data cho lịch sử order
    return this.prisma.menuItem.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}