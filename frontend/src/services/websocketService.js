class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.subscriptions = new Set();
    this.isConnected = false;
    
    // Use environment variable for WebSocket URL, fallback to localhost for development
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:8765';
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Resubscribe to previous subscriptions
          this.subscriptions.forEach(symbol => {
            this.subscribe(symbol);
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('connection_failed', { 
        message: 'Unable to establish connection to server' 
      });
    }
  }

  handleMessage(data) {
    const { type, symbol, data: messageData } = data;
    
    switch (type) {
      case 'price_update':
        this.notifyListeners('price_update', { symbol, data: messageData });
        break;
        
      case 'market_overview':
        this.notifyListeners('market_overview', messageData);
        break;
        
      case 'trading_signals':
        this.notifyListeners('trading_signals', messageData);
        break;
        
      case 'portfolio_update':
        this.notifyListeners('portfolio_update', messageData);
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  }

  subscribe(symbol) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol
      }));
      this.subscriptions.add(symbol);
    }
  }

  unsubscribe(symbol) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: symbol
      }));
      this.subscriptions.delete(symbol);
    }
  }

  requestSignals() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'get_signals'
      }));
    }
  }

  requestPortfolio() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'get_portfolio'
      }));
    }
  }

  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  removeListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;

// Hook for React components
export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = React.useState(
    websocketService.getConnectionStatus()
  );

  React.useEffect(() => {
    const updateStatus = () => {
      setConnectionStatus(websocketService.getConnectionStatus());
    };

    // Listen for connection changes
    const unsubscribeConnection = websocketService.addListener('connection_failed', updateStatus);
    
    // Update status periodically
    const interval = setInterval(updateStatus, 1000);

    return () => {
      unsubscribeConnection();
      clearInterval(interval);
    };
  }, []);

  return {
    connectionStatus,
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    subscribe: (symbol) => websocketService.subscribe(symbol),
    unsubscribe: (symbol) => websocketService.unsubscribe(symbol),
    addListener: (event, callback) => websocketService.addListener(event, callback),
    removeListener: (event, callback) => websocketService.removeListener(event, callback),
    requestSignals: () => websocketService.requestSignals(),
    requestPortfolio: () => websocketService.requestPortfolio()
  };
};