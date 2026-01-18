import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(err.message);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Join specific room
  const joinRoom = useCallback((roomType, roomId = null) => {
    if (socketRef.current && isConnected) {
      if (roomId) {
        // For order rooms with specific ID
        socketRef.current.emit(`join:${roomType}`, roomId);
        console.log(`📍 Joining room: join:${roomType} with ID:`, roomId);
      } else {
        // For general rooms (kitchen, waiter, admin)
        socketRef.current.emit(`join:${roomType}`);
        console.log(`📍 Joining room: join:${roomType}`);
      }
    }
  }, [isConnected]);

  // Leave room
  const leaveRoom = useCallback((roomType, roomId = null) => {
    if (socketRef.current && isConnected) {
      if (roomId) {
        socketRef.current.emit(`leave:${roomType}`, roomId);
        console.log(`👋 Leaving room: leave:${roomType} with ID:`, roomId);
      } else {
        socketRef.current.emit(`leave:${roomType}`);
        console.log(`👋 Leaving room: leave:${roomType}`);
      }
    }
  }, [isConnected]);

  // Subscribe to event
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Call waiter
  const callWaiter = useCallback((tableId, tableNumber) => {
    emit('waiter:call', { tableId, tableNumber });
  }, [emit]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    on,
    off,
    emit,
    callWaiter,
  };
};
