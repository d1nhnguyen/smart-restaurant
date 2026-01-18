import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { OrderStatus, OrderItemStatus, PaymentStatus, Prisma } from '@prisma/client';
import { OrdersGateway } from '../gateway/orders.gateway';

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
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersGateway: OrdersGateway,
    ) { }

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

            const TAX_RATE = 0.08;
            const taxAmount = subtotalAmount * TAX_RATE;
            const totalAmount = (Number(subtotalAmount) + taxAmount);

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
                },
            });

            // Emit WebSocket event for new order
            this.ordersGateway.emitOrderCreated(newOrder);

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
        const activeOrders = await this.prisma.order.findMany({
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

        return activeOrders;
    }

    // Get UNPAID orders for checkout (paymentStatus = PENDING)
    async findUnpaidByTable(tableId: string) {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        const unpaidOrders = await this.prisma.order.findMany({
            where: {
                tableId,
                paymentStatus: PaymentStatus.PENDING, // Only unpaid
                status: {
                    notIn: [OrderStatus.CANCELLED],
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

        return unpaidOrders;
    }

    async findAll(status?: OrderStatus) {
        const where: Prisma.OrderWhereInput = {};

        if (status) {
            where.status = status;
        }

        const orders = await this.prisma.order.findMany({
            where,
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

        return orders;
    }

    async updateStatus(id: string, newStatus: OrderStatus) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Order #${id} not found`);
        }

        // State Machine Validation
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY],
            [OrderStatus.READY]: [OrderStatus.SERVED],
            [OrderStatus.SERVED]: [OrderStatus.COMPLETED],
            [OrderStatus.COMPLETED]: [], // Terminal state
            [OrderStatus.CANCELLED]: [], // Terminal state
        };

        if (!validTransitions[order.status].includes(newStatus)) {
            throw new BadRequestException(
                `Invalid status transition from ${order.status} to ${newStatus}`,
            );
        }

        const updateData: Prisma.OrderUpdateInput = {
            status: newStatus,
        };

        if (newStatus === OrderStatus.ACCEPTED) updateData.confirmedAt = new Date();
        if (newStatus === OrderStatus.COMPLETED) updateData.completedAt = new Date();
        if (newStatus === OrderStatus.CANCELLED) updateData.cancelledAt = new Date();

        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: updateData,
                include: {
                    table: true,
                    items: {
                        include: {
                            selectedModifiers: true,
                        },
                    },
                },
            });

            // If COMPLETED or CANCELLED, free up the table
            if (newStatus === OrderStatus.COMPLETED || newStatus === OrderStatus.CANCELLED) {
                await tx.table.update({
                    where: { id: updatedOrder.tableId },
                    data: {
                        status: 'AVAILABLE',
                    },
                });
            }

            // Emit WebSocket event for status update
            this.ordersGateway.emitOrderStatusUpdated(
                updatedOrder.id,
                updatedOrder.status,
                updatedOrder,
            );

            // If order is ready, emit special notification
            if (newStatus === OrderStatus.READY) {
                this.ordersGateway.emitOrderReady(updatedOrder.id, updatedOrder);
            }

            return updatedOrder;
        });
    }

    // Methods for order status transitions
    async acceptOrder(id: string) {
        return this.updateStatus(id, OrderStatus.PREPARING);
    }

    async rejectOrder(id: string) {
        return this.updateStatus(id, OrderStatus.CANCELLED);
    }

    async sendToKitchen(id: string) {
        return this.updateStatus(id, OrderStatus.PREPARING);
    }

    async markAsReady(id: string) {
        return this.updateStatus(id, OrderStatus.READY);
    }

    async markAsServed(id: string) {
        return this.updateStatus(id, OrderStatus.SERVED);
    }

    async completeOrder(id: string) {
        return this.updateStatus(id, OrderStatus.COMPLETED);
    }

    /**
     * Add items to an existing order
     * Business Rules:
     * - Only allowed when order status is PENDING or ACCEPTED
     * - Rejected when status is PREPARING, READY, SERVED, COMPLETED, or CANCELLED
     * - Recalculates order totals after adding items
     */
    async addItemsToOrder(orderId: string, addItemsDto: AddItemsDto) {
        const { items, notes } = addItemsDto;

        // 1. Fetch the existing order
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: true,
                items: true,
            },
        });

        if (!order) {
            throw new NotFoundException(`Order #${orderId} not found`);
        }

        // 2. Validate order status - only allow PENDING or ACCEPTED
        const allowedStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.ACCEPTED];
        if (!allowedStatuses.includes(order.status)) {
            throw new BadRequestException(
                `Cannot add items to order - order is already ${order.status}. Only PENDING or ACCEPTED orders can be modified.`
            );
        }

        // 3. Process items in a transaction
        return this.prisma.$transaction(async (tx) => {
            let addedSubtotal = 0;
            const newOrderItemsData = [];

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
                    menuItem as any,
                    item.modifiers || [],
                );

                const quantity = item.quantity;
                const itemUnitPrice = Number(menuItem.price);
                const itemSubtotal = (itemUnitPrice + modifiersTotal) * quantity;
                addedSubtotal += itemSubtotal;

                newOrderItemsData.push({
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

            // 4. Create new OrderItems
            for (const orderItemData of newOrderItemsData) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        menuItemId: orderItemData.menuItemId,
                        menuItemName: orderItemData.menuItemName,
                        menuItemPrice: orderItemData.menuItemPrice,
                        quantity: orderItemData.quantity,
                        unitPrice: orderItemData.unitPrice,
                        modifiersTotal: orderItemData.modifiersTotal,
                        subtotal: orderItemData.subtotal,
                        specialRequest: orderItemData.specialRequest,
                        status: orderItemData.status,
                        selectedModifiers: {
                            create: orderItemData.modifiers.map((mod) => ({
                                modifierOptionId: mod.modifierOptionId,
                                modifierGroupName: mod.modifierGroupName,
                                modifierOptionName: mod.modifierOptionName,
                                priceAdjustment: mod.priceAdjustment,
                            })),
                        },
                    },
                });
            }

            // 5. Recalculate order totals
            const TAX_RATE = 0.08;
            const newSubtotal = Number(order.subtotalAmount) + addedSubtotal;
            const newTaxAmount = newSubtotal * TAX_RATE;
            const newTotalAmount = newSubtotal + newTaxAmount;

            // 6. Update order with new totals and append notes if provided
            const updatedNotes = notes
                ? order.notes
                    ? `${order.notes}\n[Added items] ${notes}`
                    : `[Added items] ${notes}`
                : order.notes;

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    subtotalAmount: newSubtotal,
                    taxAmount: newTaxAmount,
                    totalAmount: newTotalAmount,
                    notes: updatedNotes,
                },
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
                },
            });

            // 7. Emit WebSocket event for order items added
            this.ordersGateway.emitOrderStatusUpdated(
                updatedOrder.id,
                updatedOrder.status,
                updatedOrder,
            );

            return updatedOrder;
        });
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
