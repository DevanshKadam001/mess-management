import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Join personal user room for private order tracking & notifications
    socket.on('join_user_room', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join vendor stall room for vendor order updates & inventory alerts
    socket.on('join_vendor_room', (vendorId: string) => {
      if (vendorId) {
        socket.join(`vendor:${vendorId}`);
      }
    });

    // Join admin room
    socket.on('join_admin_room', () => {
      socket.join('admin_channel');
    });

    // Leave rooms
    socket.on('leave_user_room', (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on('leave_vendor_room', (vendorId: string) => {
      socket.leave(`vendor:${vendorId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// Notification & Event Helpers
export const emitOrderUpdateToCustomer = (userId: string, orderData: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('order_status_updated', orderData);
  }
};

export const emitNewOrderToVendor = (vendorId: string, orderData: any) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit('new_order_received', orderData);
    io.to('admin_channel').emit('system_new_order', orderData);
  }
};

export const emitInventoryAlert = (vendorId: string, alertData: any) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit('low_stock_alert', alertData);
    io.to('admin_channel').emit('admin_inventory_alert', alertData);
  }
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification);
  }
};
