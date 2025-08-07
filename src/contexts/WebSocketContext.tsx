import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  sendMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  shopId: number;
  endpoint?: 'orders' | 'production';
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  shopId,
  endpoint = 'orders' 
}) => {
  const queryClient = useQueryClient();
  const [subscribers, setSubscribers] = useState<Record<string, Set<(data: any) => void>>>({});
  
  // Construct WebSocket URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use backend host for WebSocket, not frontend host
  const wsHost = import.meta.env.DEV ? 'localhost:8000' : window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws/${endpoint}/${shopId}`;

  const handleMessage = useCallback((data: any) => {
    // WebSocket message received
    
    // Handle different message types
    switch (data.type) {
      case 'order_created':
        // Invalidate orders query to refetch
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        // Show notification
        toast.success('Новый заказ!', {
          description: `Заказ от ${data.data.customer_phone}`,
        });
        break;
      
      case 'order_updated':
        // Invalidate specific order and orders list
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order', data.data.id] });
        break;
      
      case 'status_changed':
        // Invalidate orders and show notification
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order', data.data.order_id] });
        
        toast.info('Статус заказа изменен', {
          description: `Заказ #${data.data.order_id}: ${data.data.old_status} → ${data.data.new_status}`,
        });
        break;
      
      case 'task_assigned':
        // For production endpoint
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        
        toast.info('Новая задача', {
          description: 'Вам назначена новая задача',
        });
        break;
      
      case 'connection':
        if (data.status === 'connected') {
          // WebSocket connected to shop
        }
        break;
    }
    
    // Notify subscribers
    const eventSubscribers = subscribers[data.type];
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => callback(data.data));
    }
  }, [queryClient, subscribers]);

  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onOpen: () => {
      // WebSocket connection established
      toast.success('Подключение установлено');
    },
    onClose: () => {
      // WebSocket connection closed
      toast.warning('Подключение потеряно');
    },
    onError: (error) => {
      // WebSocket error occurred
      toast.error('Ошибка подключения');
    },
    reconnect: true,
    reconnectInterval: 3000,
    reconnectAttempts: 5,
  });

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    setSubscribers(prev => {
      const eventSubscribers = prev[eventType] || new Set();
      eventSubscribers.add(callback);
      return { ...prev, [eventType]: eventSubscribers };
    });
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const eventSubscribers = prev[eventType];
        if (eventSubscribers) {
          eventSubscribers.delete(callback);
          if (eventSubscribers.size === 0) {
            const { [eventType]: _, ...rest } = prev;
            return rest;
          }
        }
        return prev;
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};