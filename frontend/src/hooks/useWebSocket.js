import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connected'); // Mock as connected
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

  // Mock WebSocket connection for demo
  useEffect(() => {
    // Simulate connection success
    setConnectionStatus('Connected');
    
    // Simulate periodic messages for dashboard
    if (url.includes('/ws/dashboard')) {
      const interval = setInterval(() => {
        const mockMessage = {
          data: JSON.stringify({
            type: 'signal_update',
            signal: {
              id: Date.now(),
              symbol: ['EURUSD', 'GBPUSD', 'USDJPY'][Math.floor(Math.random() * 3)],
              type: Math.random() > 0.5 ? 'BUY' : 'SELL',
              entry_price: (1.0 + Math.random() * 0.5).toFixed(4),
              confidence: (0.6 + Math.random() * 0.4).toFixed(2),
              status: 'active',
              created_at: new Date().toISOString()
            }
          })
        };
        
        setLastMessage(mockMessage);
        setMessageHistory(prev => [...prev.slice(-99), mockMessage]);
        
        if (onMessage) {
          onMessage(mockMessage);
        }
      }, 10000); // Send mock message every 10 seconds

      return () => clearInterval(interval);
    }
  }, [url, onMessage]);

  // Build WebSocket URL with query parameters
  const buildUrl = useCallback(() => {
    const baseUrl = url.startsWith('ws') ? url : `ws://localhost:8000${url}`;
    const params = new URLSearchParams(queryParams);
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [url, queryParams]);

  // Mock connect function
  const connect = useCallback(() => {
    setConnectionStatus('Connected');
    if (onOpen) {
      onOpen({ type: 'open' });
    }
  }, [onOpen]);

  // Mock disconnect function
  const disconnect = useCallback(() => {
    setConnectionStatus('Disconnected');
    if (onClose) {
      onClose({ type: 'close' });
    }
  }, [onClose]);

  // Mock send message function
  const sendMessage = useCallback((message) => {
    console.log('Mock WebSocket sending message:', message);
    return true;
  }, []);

  // Send JSON message
  const sendJsonMessage = useCallback((object) => {
    return sendMessage(JSON.stringify(object));
  }, [sendMessage]);

  // Get connection ready state
  const getReadyState = useCallback(() => {
    return 1; // WebSocket.OPEN
  }, []);

  return {
    socket: { readyState: 1 }, // Mock socket object
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