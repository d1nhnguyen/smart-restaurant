import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuStatus } from '@prisma/client';
@Injectable()
export class MenuCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateCategoryDto) {
    // Check trùng tên trong cùng nhà hàng
    const exists = await this.prisma.menuCategory.findUnique({
      where: {
        restaurantId_name: {
          restaurantId,
          name: dto.name,
        },
      },
    });

    if (exists) {
      throw new ConflictException('Category name already exists in this restaurant');
    }

    return this.prisma.menuCategory.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' }, // Sắp xếp theo thứ tự hiển thị
      include: {
        _count: {
            select: { items: { where: { isDeleted: false } } } // Đếm số món ăn đang có
        }
      }
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateCategoryDto) {
    // Check tồn tại
    const category = await this.prisma.menuCategory.findFirst({
        where: { id, restaurantId }
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.menuCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, restaurantId: string) {
    // Kiểm tra ràng buộc trước khi xóa
    const category = await this.prisma.menuCategory.findFirst({
        where: { id, restaurantId },
        include: { items: { where: { isDeleted: false } } }
    });

    if (!category) throw new NotFoundException('Category not found');

    // Rule: Không được xóa nếu còn món ăn active
    if (category.items.length > 0) {
      throw new BadRequestException('Cannot delete category that contains active items. Please move or delete items first.');
    }

    // Soft delete (chuyển sang inactive) hoặc Hard delete tùy yêu cầu
    // Ở đây dùng Hard Delete vì đã check items rỗng
    return this.prisma.menuCategory.delete({
      where: { id },
    });
  }
  async updateStatus(id: string, restaurantId: string, status: MenuStatus) {
    // Check tồn tại
    const category = await this.prisma.menuCategory.findFirst({
        where: { id, restaurantId }
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.menuCategory.update({
      where: { id },
      data: { status },
    });
  }
}