import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

interface WebSocketState {
  isConnected: boolean;
  lastMessage: any;
  error: Error | null;
}

export const useWebSocket = ({
  url,
  onOpen,
  onClose,
  onError,
  onMessage,
  reconnect = true,
  reconnectInterval = 3000,
  reconnectAttempts = 5,
}: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    error: null,
  });

  const connect = useCallback(() => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      const wsUrl = token ? `${url}?token=${token}` : url;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        // WebSocket connected
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectCount.current = 0;
        onOpen?.();
      };

      ws.current.onclose = () => {
        // WebSocket disconnected
        setState(prev => ({ ...prev, isConnected: false }));
        onClose?.();

        // Attempt reconnection
        if (reconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          // Reconnecting...
          
          // Exponential backoff
          const delay = reconnectInterval * Math.pow(1.5, reconnectCount.current - 1);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.current.onerror = (error) => {
        // WebSocket error occurred
        setState(prev => ({ ...prev, error: new Error('WebSocket connection failed') }));
        onError?.(error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ping/pong
          if (data.type === 'ping') {
            ws.current?.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.(data);
        } catch (error) {
          // Failed to parse WebSocket message
        }
      };
    } catch (error) {
      // Failed to create WebSocket connection
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }));
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnect, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      // WebSocket is not connected
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: state.isConnected,
    lastMessage: state.lastMessage,
    error: state.error,
    sendMessage,
    reconnect: connect,
    disconnect,
  };
};