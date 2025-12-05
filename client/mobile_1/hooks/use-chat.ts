import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/api.config';

let socket: Socket | null = null;

export const useChat = (userId: string | undefined) => {
  const [isConnected, setIsConnected] = useState(false);
  const messageHandlersRef = useRef<{[key: string]: (data: any) => void}>({});

  useEffect(() => {
    if (!userId) return;

    // Initialize socket if not already initialized
    if (!socket) {
      socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('✅ Connected to chat server');
        socket?.emit('user-join', userId);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from chat server');
        setIsConnected(false);
      });

      socket.on('message-received', (message) => {
        console.log('💬 Message received:', message);
        if (messageHandlersRef.current['message-received']) {
          messageHandlersRef.current['message-received'](message);
        }
      });

      socket.on('message-sent', (data) => {
        if (messageHandlersRef.current['message-sent']) {
          messageHandlersRef.current['message-sent'](data);
        }
      });

      socket.on('typing-indicator', (data) => {
        if (messageHandlersRef.current['typing']) {
          messageHandlersRef.current['typing'](data);
        }
      });

      socket.on('message-error', (error) => {
        console.error('❌ Message error:', error);
        if (messageHandlersRef.current['error']) {
          messageHandlersRef.current['error'](error);
        }
      });
    } else {
      // Already connected, just join with user ID
      socket.emit('user-join', userId);
      setIsConnected(true);
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive for other components
    };
  }, [userId]);

  const sendMessage = (receiver_id: string | number, contenu: string) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        sender_id: userId,
        receiver_id,
        contenu
      });
    } else {
      console.error('Socket not connected');
    }
  };

  const sendTyping = (receiver_id: string | number, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('user-typing', {
        sender_id: userId,
        receiver_id,
        isTyping
      });
    }
  };

  const markAsRead = (messageId: string | number) => {
    if (socket && isConnected) {
      socket.emit('message-read', { messageId });
    }
  };

  const onMessageReceived = (callback: (message: any) => void) => {
    messageHandlersRef.current['message-received'] = callback;
  };

  const onMessageSent = (callback: (data: any) => void) => {
    messageHandlersRef.current['message-sent'] = callback;
  };

  const onTyping = (callback: (data: any) => void) => {
    messageHandlersRef.current['typing'] = callback;
  };

  const onError = (callback: (error: any) => void) => {
    messageHandlersRef.current['error'] = callback;
  };

  return {
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
    onMessageReceived,
    onMessageSent,
    onTyping,
    onError
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
