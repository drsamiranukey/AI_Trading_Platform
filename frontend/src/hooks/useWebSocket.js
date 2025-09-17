import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [messageHistory, setMessageHistory] = useState([]);
  
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    protocols = [],
    queryParams = {},
    headers = {}
  } = options;

  const reconnectTimeoutId = useRef(null);
  const reconnectCount = useRef(0);
  const socketRef = useRef(null);

  // Build WebSocket URL with query parameters
  const buildUrl = useCallback(() => {
    const baseUrl = url.startsWith('ws') ? url : `ws://localhost:8000${url}`;
    const params = new URLSearchParams(queryParams);
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [url, queryParams]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const wsUrl = buildUrl();
      const ws = new WebSocket(wsUrl, protocols);
      
      ws.onopen = (event) => {
        console.log('WebSocket connected:', wsUrl);
        setConnectionStatus('Connected');
        setSocket(ws);
        socketRef.current = ws;
        reconnectCount.current = 0;
        
        if (onOpen) {
          onOpen(event);
        }
      };

      ws.onmessage = (event) => {
        const message = event;
        setLastMessage(message);
        setMessageHistory(prev => [...prev.slice(-99), message]); // Keep last 100 messages
        
        if (onMessage) {
          onMessage(message);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        setSocket(null);
        socketRef.current = null;
        
        if (onClose) {
          onClose(event);
        }

        // Attempt to reconnect if enabled
        if (shouldReconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          setConnectionStatus(`Reconnecting (${reconnectCount.current}/${reconnectAttempts})`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionStatus('Error');
        
        if (onError) {
          onError(event);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  }, [buildUrl, protocols, onOpen, onMessage, onClose, onError, shouldReconnect, reconnectAttempts, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
        socketRef.current.send(messageToSend);
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
      return false;
    }
  }, []);

  // Send JSON message
  const sendJsonMessage = useCallback((object) => {
    return sendMessage(JSON.stringify(object));
  }, [sendMessage]);

  // Get connection ready state
  const getReadyState = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current.readyState;
    }
    return WebSocket.CLOSED;
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
    };
  }, []);

  return {
    socket,
    lastMessage,
    connectionStatus,
    messageHistory,
    sendMessage,
    sendJsonMessage,
    connect,
    disconnect,
    getReadyState
  };
};

// WebSocket ready states
export const WEBSOCKET_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

// Custom hook for specific trading data WebSocket
export const useTradingWebSocket = (endpoint = '/ws/trading') => {
  const [tradingData, setTradingData] = useState({
    signals: [],
    accounts: [],
    positions: [],
    prices: {}
  });

  const handleMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'signal_update':
          setTradingData(prev => ({
            ...prev,
            signals: updateArrayItem(prev.signals, data.signal, 'id')
          }));
          break;
          
        case 'account_update':
          setTradingData(prev => ({
            ...prev,
            accounts: updateArrayItem(prev.accounts, data.account, 'id')
          }));
          break;
          
        case 'position_update':
          setTradingData(prev => ({
            ...prev,
            positions: updateArrayItem(prev.positions, data.position, 'id')
          }));
          break;
          
        case 'price_update':
          setTradingData(prev => ({
            ...prev,
            prices: {
              ...prev.prices,
              [data.symbol]: data.price
            }
          }));
          break;
          
        case 'bulk_update':
          setTradingData(prev => ({
            ...prev,
            ...data.data
          }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);

  const websocket = useWebSocket(endpoint, {
    onMessage: handleMessage,
    shouldReconnect: true,
    reconnectAttempts: 10,
    reconnectInterval: 5000
  });

  // Subscribe to specific data types
  const subscribe = useCallback((dataTypes) => {
    websocket.sendJsonMessage({
      action: 'subscribe',
      data_types: Array.isArray(dataTypes) ? dataTypes : [dataTypes]
    });
  }, [websocket]);

  // Unsubscribe from specific data types
  const unsubscribe = useCallback((dataTypes) => {
    websocket.sendJsonMessage({
      action: 'unsubscribe',
      data_types: Array.isArray(dataTypes) ? dataTypes : [dataTypes]
    });
  }, [websocket]);

  return {
    ...websocket,
    tradingData,
    subscribe,
    unsubscribe
  };
};

// Helper function to update array items
const updateArrayItem = (array, newItem, keyField) => {
  const existingIndex = array.findIndex(item => item[keyField] === newItem[keyField]);
  
  if (existingIndex >= 0) {
    // Update existing item
    const newArray = [...array];
    newArray[existingIndex] = { ...newArray[existingIndex], ...newItem };
    return newArray;
  } else {
    // Add new item
    return [...array, newItem];
  }
};