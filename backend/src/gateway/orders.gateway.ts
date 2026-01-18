import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('OrdersGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Join room for specific order tracking
  @SubscribeMessage('join:order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order:${orderId}`);
    this.logger.log(`Client ${client.id} joined order:${orderId}`);
    return { success: true, message: `Joined order ${orderId}` };
  }

  // Join room for kitchen staff
  @SubscribeMessage('join:kitchen')
  handleJoinKitchen(@ConnectedSocket() client: Socket) {
    client.join('kitchen');
    this.logger.log(`Client ${client.id} joined kitchen room`);
    return { success: true, message: 'Joined kitchen room' };
  }

  // Join room for waiters
  @SubscribeMessage('join:waiter')
  handleJoinWaiter(@ConnectedSocket() client: Socket) {
    client.join('waiter');
    this.logger.log(`Client ${client.id} joined waiter room`);
    return { success: true, message: 'Joined waiter room' };
  }

  // Join room for admin/manager
  @SubscribeMessage('join:admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    this.logger.log(`Client ${client.id} joined admin room`);
    return { success: true, message: 'Joined admin room' };
  }

  // Call waiter
  @SubscribeMessage('waiter:call')
  handleCallWaiter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string; tableNumber: string },
  ) {
    this.logger.log(`Waiter called for table ${data.tableNumber}`);
    this.server.to('waiter').emit('waiter:called', {
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      timestamp: new Date().toISOString(),
    });
    return { success: true, message: 'Waiter has been notified' };
  }

  // Emit order created event (only to admin/waiter, NOT kitchen)
  emitOrderCreated(order: any) {
    this.logger.log(`Emitting order:created for order ${order.orderNumber}`);
    // Only emit to admin - kitchen will receive when order is accepted (PREPARING)
    this.server.to('admin').emit('order:created', order);
  }

  // Emit order status updated (to customer tracking specific order)
  emitOrderStatusUpdated(orderId: string, status: string, order: any) {
    this.logger.log(`Emitting order:statusUpdated for order ${orderId} - ${status}`);

    // Always emit to order tracking room
    this.server.to(`order:${orderId}`).emit('order:statusUpdated', {
      orderId,
      status,
      order,
      timestamp: new Date().toISOString(),
    });

    // Always emit to admin
    this.server.to('admin').emit('order:statusUpdated', {
      orderId,
      status,
      order,
      timestamp: new Date().toISOString(),
    });

    // ONLY send to kitchen when order becomes PREPARING (after waiter accepts)
    if (status === 'PREPARING') {
      this.logger.log(`Sending order ${orderId} to kitchen (status: PREPARING)`);
      this.server.to('kitchen').emit('order:created', order);
    }

    // Update kitchen when order status changes (READY, SERVED, etc.)
    if (status === 'READY' || status === 'SERVED' || status === 'COMPLETED' || status === 'CANCELLED') {
      this.server.to('kitchen').emit('order:statusUpdated', {
        orderId,
        status,
        order,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Emit order item status updated
  emitOrderItemStatusUpdated(orderId: string, itemId: string, status: string) {
    this.logger.log(`Emitting orderItem:statusUpdated for item ${itemId} - ${status}`);
    this.server.to(`order:${orderId}`).to('kitchen').to('admin').emit('orderItem:statusUpdated', {
      orderId,
      itemId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit order ready notification
  emitOrderReady(orderId: string, order: any) {
    this.logger.log(`Emitting order:ready for order ${orderId}`);
    this.server.to(`order:${orderId}`).emit('order:ready', {
      orderId,
      order,
      message: 'Your order is ready!',
      timestamp: new Date().toISOString(),
    });

    // Notify waiters to serve
    this.server.to('waiter').emit('order:readyToServe', {
      orderId,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit payment completed
  emitPaymentCompleted(orderId: string, paymentData: any) {
    this.logger.log(`Emitting payment:completed for order ${orderId}`);
    this.server.to(`order:${orderId}`).to('admin').emit('payment:completed', {
      orderId,
      paymentData,
      timestamp: new Date().toISOString(),
    });
  }
}
