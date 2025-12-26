import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@Injectable()
export class ModifierGroupService {
  constructor(private prisma: PrismaService) {}

  // ===== MODIFIER GROUPS =====

  async create(restaurantId: string, dto: CreateModifierGroupDto) {
    // Validation: if multi-select, maxSelections must be >= minSelections
    if (dto.selectionType === 'MULTIPLE' && dto.minSelections && dto.maxSelections) {
      if (dto.maxSelections < dto.minSelections) {
        throw new BadRequestException('maxSelections must be greater than or equal to minSelections');
      }
    }

    // Validation: if required and single-select, minSelections should be 1
    if (dto.isRequired && dto.selectionType === 'SINGLE') {
      dto.minSelections = 1;
      dto.maxSelections = 1;
    }

    return this.prisma.modifierGroup.create({
      data: {
        restaurantId,
        ...dto,
        minSelections: dto.minSelections || 0,
        maxSelections: dto.maxSelections || 0,
        displayOrder: dto.displayOrder || 0,
        isRequired: dto.isRequired || false,
      },
      include: {
        options: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { restaurantId },
      include: {
        options: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { options: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
      include: {
        options: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return group;
  }

  async update(id: string, restaurantId: string, dto: UpdateModifierGroupDto) {
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    // Validation: if multi-select, maxSelections must be >= minSelections
    if (dto.selectionType === 'MULTIPLE' || group.selectionType === 'MULTIPLE') {
      const minSel = dto.minSelections ?? group.minSelections;
      const maxSel = dto.maxSelections ?? group.maxSelections;
      if (maxSel < minSel) {
        throw new BadRequestException('maxSelections must be greater than or equal to minSelections');
      }
    }

    return this.prisma.modifierGroup.update({
      where: { id },
      data: dto,
      include: {
        options: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
      include: {
        menuItems: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    // Check if group is attached to any items
    if (group.menuItems.length > 0) {
      throw new BadRequestException('Cannot delete modifier group that is attached to menu items');
    }

    return this.prisma.modifierGroup.delete({
      where: { id },
    });
  }

  // ===== MODIFIER OPTIONS =====

  async createOption(groupId: string, restaurantId: string, dto: CreateModifierOptionDto) {
    // Verify group exists and belongs to restaurant
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id: groupId, restaurantId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return this.prisma.modifierOption.create({
      data: {
        groupId,
        name: dto.name,
        priceAdjustment: dto.priceAdjustment || 0,
      },
    });
  }

  async updateOption(optionId: string, restaurantId: string, dto: UpdateModifierOptionDto) {
    // Verify option exists and belongs to restaurant
    const option = await this.prisma.modifierOption.findFirst({
      where: {
        id: optionId,
        group: { restaurantId },
      },
      include: { group: true },
    });

    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    return this.prisma.modifierOption.update({
      where: { id: optionId },
      data: dto,
    });
  }

  async removeOption(optionId: string, restaurantId: string) {
    // Verify option exists and belongs to restaurant
    const option = await this.prisma.modifierOption.findFirst({
      where: {
        id: optionId,
        group: { restaurantId },
      },
      include: { group: true },
    });

    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    return this.prisma.modifierOption.delete({
      where: { id: optionId },
    });
  }

  // ===== ATTACH/DETACH GROUPS TO ITEMS =====

  async attachGroupsToItem(itemId: string, restaurantId: string, groupIds: string[]) {
    // Verify item exists and belongs to restaurant
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Verify all groups exist and belong to restaurant
    const groups = await this.prisma.modifierGroup.findMany({
      where: {
        id: { in: groupIds },
        restaurantId,
      },
    });

    if (groups.length !== groupIds.length) {
      throw new BadRequestException('One or more modifier groups not found');
    }

    // Clear existing attachments
    await this.prisma.menuItemModifierGroup.deleteMany({
      where: { menuItemId: itemId },
    });

    // Create new attachments
    if (groupIds.length > 0) {
      await this.prisma.menuItemModifierGroup.createMany({
        data: groupIds.map((groupId) => ({
          menuItemId: itemId,
          groupId,
        })),
      });
    }

    // Return updated item with modifier groups
    return this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        modifierGroups: {
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
    });
  }
}
