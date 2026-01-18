import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Post(':id/items')
    addItems(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() addItemsDto: AddItemsDto,
    ) {
        return this.ordersService.addItemsToOrder(id, addItemsDto);
    }

    @Get()
    findAll(@Query('status') status?: OrderStatus) {
        return this.ordersService.findAll(status);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: OrderStatus,
    ) {
        return this.ordersService.updateStatus(id, status);
    }

    @Post(':id/accept')
    acceptOrder(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.acceptOrder(id);
    }

    @Post(':id/reject')
    rejectOrder(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.rejectOrder(id);
    }

    @Post(':id/send-to-kitchen')
    sendToKitchen(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.sendToKitchen(id);
    }

    @Post(':id/mark-ready')
    markAsReady(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.markAsReady(id);
    }

    @Post(':id/served')
    markAsServed(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.markAsServed(id);
    }

    @Post(':id/complete')
    completeOrder(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.completeOrder(id);
    }

    @Get('current')
    findCurrentByTable(@Query('tableId', ParseUUIDPipe) tableId: string) {
        return this.ordersService.findCurrentByTable(tableId);
    }

    @Get('unpaid')
    findUnpaidByTable(@Query('tableId', ParseUUIDPipe) tableId: string) {
        return this.ordersService.findUnpaidByTable(tableId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }
}
