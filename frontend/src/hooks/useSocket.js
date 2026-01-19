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
      // Socket connected
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      // Socket disconnected
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
        // Joining room
      } else {
        // For general rooms (kitchen, waiter, admin)
        socketRef.current.emit(`join:${roomType}`);
        // Joining room
      }
    }
  }, [isConnected]);

  // Leave room
  const leaveRoom = useCallback((roomType, roomId = null) => {
    if (socketRef.current && isConnected) {
      if (roomId) {
        socketRef.current.emit(`leave:${roomType}`, roomId);
        // Leaving room
      } else {
        socketRef.current.emit(`leave:${roomType}`);
        // Leaving room
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
