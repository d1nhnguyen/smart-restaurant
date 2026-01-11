import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, OrderItemStatus, Prisma } from '@prisma/client';

// Type definitions for better type safety
interface ModifierValidationResult {
    modifiersTotal: number;
    selectedModifiersData: {
        modifierOptionId: string;
        modifierGroupId: string;
        modifierGroupName: string;
        modifierOptionName: string;
        priceAdjustment: number;
    }[];
}

interface MenuItemWithModifiers {
    id: string;
    name: string;
    price: Prisma.Decimal;
    status: string;
    modifierGroups: {
        group: {
            id: string;
            name: string;
            isRequired: boolean;
            minSelections: number;
            maxSelections: number;
            selectionType: string;
            options: {
                id: string;
                name: string;
                priceAdjustment: Prisma.Decimal;
                status: string;
            }[];
        };
    }[];
}

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createOrderDto: CreateOrderDto) {
        const { tableId, items, notes } = createOrderDto;

        // 1. Validate Table
        const table = await this.prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        if (table.status === 'INACTIVE') {
            throw new BadRequestException('Table is not active');
        }

        return this.prisma.$transaction(async (tx) => {
            let subtotalAmount = 0;
            const orderItemsData = [];

            for (const item of items) {
                // Fetch Menu Item WITH all modifier groups and options
                const menuItem = await tx.menuItem.findUnique({
                    where: { id: item.menuItemId },
                    include: {
                        modifierGroups: {
                            where: { group: { status: 'ACTIVE' } },
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

                if (!menuItem) {
                    throw new NotFoundException(`Menu item "${item.menuItemId}" not found`);
                }

                if (menuItem.status !== 'AVAILABLE') {
                    throw new BadRequestException(`Menu item "${menuItem.name}" is not available`);
                }

                // Validate modifiers with full business rules
                const { modifiersTotal, selectedModifiersData } = this.validateAndProcessModifiers(
                    menuItem as any, // Cast to any to handle nested Prisma types
                    item.modifiers || [],
                );

                const quantity = item.quantity;
                const itemUnitPrice = Number(menuItem.price);
                const itemSubtotal = (itemUnitPrice + modifiersTotal) * quantity;
                subtotalAmount += itemSubtotal;

                orderItemsData.push({
                    menuItemId: menuItem.id,
                    menuItemName: menuItem.name,
                    menuItemPrice: itemUnitPrice,
                    quantity,
                    unitPrice: itemUnitPrice,
                    modifiersTotal,
                    subtotal: itemSubtotal,
                    specialRequest: item.specialRequest,
                    status: OrderItemStatus.PENDING,
                    modifiers: selectedModifiersData,
                });
            }

            // Generate order number
            const orderNumber = this.generateOrderNumber();

            const taxAmount = 0;
            const totalAmount = subtotalAmount + taxAmount;

            // Create Order
            const newOrder = await tx.order.create({
                data: {
                    tableId,
                    orderNumber,
                    orderDate: new Date(),
                    status: OrderStatus.PENDING,
                    subtotalAmount,
                    taxAmount,
                    totalAmount,
                    notes,
                    items: {
                        create: orderItemsData.map((orderItem) => ({
                            menuItemId: orderItem.menuItemId,
                            menuItemName: orderItem.menuItemName,
                            menuItemPrice: orderItem.menuItemPrice,
                            quantity: orderItem.quantity,
                            unitPrice: orderItem.unitPrice,
                            modifiersTotal: orderItem.modifiersTotal,
                            subtotal: orderItem.subtotal,
                            specialRequest: orderItem.specialRequest,
                            status: orderItem.status,
                            selectedModifiers: {
                                create: orderItem.modifiers.map((mod) => ({
                                    modifierOptionId: mod.modifierOptionId,
                                    modifierGroupName: mod.modifierGroupName,
                                    modifierOptionName: mod.modifierOptionName,
                                    priceAdjustment: mod.priceAdjustment,
                                })),
                            },
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            selectedModifiers: true,
                        },
                    },
                    table: true,
                },
            });

            // Update table status
            await tx.table.update({
                where: { id: tableId },
                data: {
                    status: 'OCCUPIED',
                    currentOrderId: newOrder.id,
                },
            });

            return newOrder;
        });
    }

    async findOne(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                table: true,
                items: {
                    include: {
                        selectedModifiers: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException(`Order #${id} not found`);
        }

        return order;
    }

    async findCurrentByTable(tableId: string) {
        // 1. Check if table exists
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        // 2. Find the most recent active order (not completed or cancelled)
        const activeOrder = await this.prisma.order.findFirst({
            where: {
                tableId,
                status: {
                    notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
                },
            },
            include: {
                table: {
                    select: {
                        id: true,
                        tableNumber: true,
                        location: true,
                    },
                },
                items: {
                    include: {
                        selectedModifiers: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return activeOrder;
    }

    /**
     * Validate modifiers according to business rules:
     * 1. Modifier must belong to this menu item
     * 2. Required modifier groups must have selections
     * 3. Number of selections must be within min-max range
     * 4. Single-select groups only allowed 1 option
     */
    private validateAndProcessModifiers(
        menuItem: MenuItemWithModifiers,
        requestedModifiers: { modifierOptionId: string }[],
    ): ModifierValidationResult {
        const selectedModifiersData: ModifierValidationResult['selectedModifiersData'] = [];
        let modifiersTotal = 0;

        // Build a map of all valid modifier options for this menu item
        const validOptionsMap = new Map<
            string,
            {
                option: MenuItemWithModifiers['modifierGroups'][0]['group']['options'][0];
                group: MenuItemWithModifiers['modifierGroups'][0]['group'];
            }
        >();

        const modifierGroups = menuItem.modifierGroups.map((mg) => mg.group);

        for (const group of modifierGroups) {
            for (const option of group.options) {
                validOptionsMap.set(option.id, { option, group });
            }
        }

        // Group requested modifiers by their group
        const selectionsByGroup = new Map<
            string,
            {
                group: MenuItemWithModifiers['modifierGroups'][0]['group'];
                selectedOptions: {
                    option: MenuItemWithModifiers['modifierGroups'][0]['group']['options'][0];
                    modifierOptionId: string;
                }[];
            }
        >();

        // Validate each requested modifier
        for (const reqMod of requestedModifiers) {
            const validOption = validOptionsMap.get(reqMod.modifierOptionId);

            // Rule 1: Modifier must belong to this menu item
            if (!validOption) {
                throw new BadRequestException(
                    `Modifier option "${reqMod.modifierOptionId}" is not valid for "${menuItem.name}"`,
                );
            }

            const { option, group } = validOption;

            // Track selections by group
            if (!selectionsByGroup.has(group.id)) {
                selectionsByGroup.set(group.id, {
                    group,
                    selectedOptions: [],
                });
            }

            selectionsByGroup.get(group.id)!.selectedOptions.push({
                option,
                modifierOptionId: reqMod.modifierOptionId,
            });
        }

        // Validate each modifier group's rules
        for (const group of modifierGroups) {
            const groupSelections = selectionsByGroup.get(group.id);
            const selectedCount = groupSelections?.selectedOptions.length || 0;

            // Rule 2: Required groups must have selections
            if (group.isRequired && selectedCount === 0) {
                throw new BadRequestException(
                    `"${group.name}" is required for "${menuItem.name}". Please select at least ${group.minSelections || 1} option(s).`,
                );
            }

            // Rule 3: Check minimum selections (if group has selections or is required)
            if (selectedCount > 0 || group.isRequired) {
                if (group.minSelections > 0 && selectedCount < group.minSelections) {
                    throw new BadRequestException(
                        `"${group.name}" requires at least ${group.minSelections} selection(s), but only ${selectedCount} provided.`,
                    );
                }
            }

            // Rule 4: Check maximum selections
            if (group.maxSelections > 0 && selectedCount > group.maxSelections) {
                throw new BadRequestException(
                    `"${group.name}" allows maximum ${group.maxSelections} selection(s), but ${selectedCount} provided.`,
                );
            }

            // Rule 5: Single-select validation
            if (group.selectionType === 'SINGLE' && selectedCount > 1) {
                throw new BadRequestException(
                    `"${group.name}" only allows single selection, but ${selectedCount} options were selected.`,
                );
            }

            // Check for duplicate selections within the same group
            if (groupSelections) {
                const optionIds = groupSelections.selectedOptions.map((s) => s.modifierOptionId);
                const uniqueIds = new Set(optionIds);
                if (uniqueIds.size !== optionIds.length) {
                    throw new BadRequestException(`Duplicate modifier options detected in "${group.name}".`);
                }
            }
        }

        // Process valid modifiers and calculate total
        for (const [, groupData] of selectionsByGroup) {
            for (const selection of groupData.selectedOptions) {
                const priceAdjustment = Number(selection.option.priceAdjustment);
                modifiersTotal += priceAdjustment;

                selectedModifiersData.push({
                    modifierOptionId: selection.option.id,
                    modifierGroupId: groupData.group.id,
                    modifierGroupName: groupData.group.name,
                    modifierOptionName: selection.option.name,
                    priceAdjustment,
                });
            }
        }

        return {
            modifiersTotal,
            selectedModifiersData,
        };
    }

    /**
     * Generate unique order number: YYMMDD-XXXXXX
     */
    private generateOrderNumber(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${dateStr}-${randomStr}`;
    }
}
