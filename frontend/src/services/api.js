import axios from 'axios';

// Base URL for API - Using mock API for demo
const BASE_URL = process.env.REACT_APP_API_URL || 'https://jsonplaceholder.typicode.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;
          localStorage.setItem('token', access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API service class
class ApiService {
  constructor() {
    this.client = apiClient;
  }

  // Set auth token
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Generic request methods with mock data fallback
  async get(url, config = {}) {
    // Check if we need to return mock data for dashboard endpoints
    if (url.includes('/mt5/accounts')) {
      return {
        data: [
          {
            id: 1,
            account_number: '12345678',
            server: 'MetaQuotes-Demo',
            balance: 10000.00,
            equity: 10250.50,
            margin: 500.00,
            free_margin: 9750.50,
            profit: 250.50,
            currency: 'USD',
            leverage: 100,
            status: 'connected',
            last_updated: new Date().toISOString()
          }
        ]
      };
    }
    
    if (url.includes('/signals')) {
      if (url.includes('market-sentiment')) {
        return {
          data: {
            overall_sentiment: 'bullish',
            bullish_signals: 15,
            bearish_signals: 8,
            neutral_signals: 3,
            confidence: 0.75
          }
        };
      }
      
      if (url.includes('performance/stats')) {
        return {
          data: {
            total_signals: 156,
            successful_signals: 98,
            win_rate: 0.628,
            total_profit: 2450.75,
            average_profit: 25.01,
            max_drawdown: -150.25
          }
        };
      }
      
      // Default signals list
      return {
        data: [
          {
            id: 1,
            symbol: 'EURUSD',
            type: 'BUY',
            entry_price: 1.0850,
            stop_loss: 1.0800,
            take_profit: 1.0920,
            confidence: 0.85,
            status: 'active',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 2,
            symbol: 'GBPUSD',
            type: 'SELL',
            entry_price: 1.2650,
            stop_loss: 1.2700,
            take_profit: 1.2580,
            confidence: 0.78,
            status: 'closed',
            created_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 3,
            symbol: 'USDJPY',
            type: 'BUY',
            entry_price: 149.50,
            stop_loss: 149.00,
            take_profit: 150.20,
            confidence: 0.72,
            status: 'pending',
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      };
    }
    
    // For other endpoints, try the actual API call
    try {
      return this.client.get(url, config);
    } catch (error) {
      // Return empty data if API call fails
      return { data: null };
    }
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  // Authentication endpoints
  async login(credentials) {
    // Mock login for demo purposes
    if (credentials.email === 'admin@aitrading.com' && credentials.password === 'admin123') {
      return {
        data: {
          access_token: 'mock_admin_token_' + Date.now(),
          refresh_token: 'mock_refresh_token_' + Date.now(),
          token_type: 'bearer',
          expires_in: 1800,
          user: {
            id: 1,
            email: 'admin@aitrading.com',
            username: 'admin',
            full_name: 'System Administrator',
            role: 'admin',
            is_active: true,
            is_verified: true
          }
        }
      };
    } else if (credentials.email && credentials.password) {
      // Mock regular user login
      return {
        data: {
          access_token: 'mock_user_token_' + Date.now(),
          refresh_token: 'mock_refresh_token_' + Date.now(),
          token_type: 'bearer',
          expires_in: 1800,
          user: {
            id: 2,
            email: credentials.email,
            username: credentials.email.split('@')[0],
            full_name: 'Demo User',
            role: 'free',
            is_active: true,
            is_verified: true
          }
        }
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async register(userData) {
    // Mock registration for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    return {
      data: {
        id: Math.floor(Math.random() * 1000) + 100,
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        full_name: userData.full_name || `${userData.first_name} ${userData.last_name}`,
        phone: userData.phone,
        country: userData.country,
        timezone: userData.timezone,
        subscription_plan: userData.subscription_plan || 'basic',
        role: 'free',
        is_active: true,
        is_verified: false,
        created_at: new Date().toISOString()
      }
    };
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async refreshToken(refreshToken) {
    return this.post('/auth/refresh', { refresh_token: refreshToken });
  }

  async getCurrentUser() {
    // Mock current user for demo purposes
    const token = localStorage.getItem('token');
    if (token && token.includes('admin')) {
      return {
        data: {
          id: 1,
          email: 'admin@aitrading.com',
          username: 'admin',
          full_name: 'System Administrator',
          role: 'admin',
          is_active: true,
          is_verified: true
        }
      };
    } else if (token) {
      return {
        data: {
          id: 2,
          email: 'user@demo.com',
          username: 'demo_user',
          full_name: 'Demo User',
          role: 'free',
          is_active: true,
          is_verified: true
        }
      };
    } else {
      throw new Error('Not authenticated');
    }
  }

  async updateProfile(userData) {
    return this.put('/auth/me', userData);
  }

  async changePassword(passwordData) {
    return this.post('/auth/change-password', passwordData);
  }

  async requestPasswordReset(email) {
    return this.post('/auth/password-reset-request', { email });
  }

  async resetPassword(resetData) {
    return this.post('/auth/password-reset', resetData);
  }

  // MT5 Account endpoints
  async getMT5Accounts() {
    return this.get('/mt5/accounts');
  }

  async createMT5Account(accountData) {
    return this.post('/mt5/accounts', accountData);
  }

  async getMT5Account(accountId) {
    return this.get(`/mt5/accounts/${accountId}`);
  }

  async updateMT5Account(accountId, accountData) {
    return this.put(`/mt5/accounts/${accountId}`, accountData);
  }

  async deleteMT5Account(accountId) {
    return this.delete(`/mt5/accounts/${accountId}`);
  }

  async connectMT5Account(accountId) {
    return this.post(`/mt5/accounts/${accountId}/connect`);
  }

  async disconnectMT5Account(accountId) {
    return this.post(`/mt5/accounts/${accountId}/disconnect`);
  }

  async getMT5AccountInfo(accountId) {
    return this.get(`/mt5/accounts/${accountId}/info`);
  }

  async getMT5Positions(accountId) {
    return this.get(`/mt5/accounts/${accountId}/positions`);
  }

  async getMT5TradeHistory(accountId, params = {}) {
    return this.get(`/mt5/accounts/${accountId}/history`, { params });
  }

  async placeMT5Order(accountId, orderData) {
    return this.post(`/mt5/accounts/${accountId}/orders`, orderData);
  }

  async closeMT5Position(accountId, positionId) {
    return this.delete(`/mt5/accounts/${accountId}/positions/${positionId}`);
  }

  // Trading Signals endpoints
  async getTradingSignals(params = {}) {
    return this.get('/signals', { params });
  }

  async createTradingSignal(signalData) {
    return this.post('/signals', signalData);
  }

  async getTradingSignal(signalId) {
    return this.get(`/signals/${signalId}`);
  }

  async updateTradingSignal(signalId, signalData) {
    return this.put(`/signals/${signalId}`, signalData);
  }

  async deleteTradingSignal(signalId) {
    return this.delete(`/signals/${signalId}`);
  }

  async generateSignals(params = {}) {
    return this.post('/signals/generate', params);
  }

  async getMarketSentiment(symbol) {
    return this.get(`/signals/sentiment/${symbol}`);
  }

  async backtestStrategy(strategyData) {
    return this.post('/signals/backtest', strategyData);
  }

  async trainAIModel(trainingData) {
    return this.post('/signals/train', trainingData);
  }

  async getSignalPerformance(params = {}) {
    return this.get('/signals/performance', { params });
  }

  // Trading Bot endpoints
  async getTradingBots() {
    return this.get('/trading-bots');
  }

  async createTradingBot(botData) {
    return this.post('/trading-bots', botData);
  }

  async getTradingBot(botId) {
    return this.get(`/trading-bots/${botId}`);
  }

  async updateTradingBot(botId, botData) {
    return this.put(`/trading-bots/${botId}`, botData);
  }

  async deleteTradingBot(botId) {
    return this.delete(`/trading-bots/${botId}`);
  }

  async startTradingBot(botId) {
    return this.post(`/trading-bots/${botId}/start`);
  }

  async stopTradingBot(botId) {
    return this.post(`/trading-bots/${botId}/stop`);
  }

  async getTradingBotStatus(botId) {
    return this.get(`/trading-bots/${botId}/status`);
  }

  async getTradingBotPerformance(botId, params = {}) {
    return this.get(`/trading-bots/${botId}/performance`, { params });
  }

  // Subscription endpoints
  async getSubscriptions() {
    return this.get('/subscriptions');
  }

  async createSubscription(subscriptionData) {
    return this.post('/subscriptions', subscriptionData);
  }

  async getSubscription(subscriptionId) {
    return this.get(`/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId, subscriptionData) {
    return this.put(`/subscriptions/${subscriptionId}`, subscriptionData);
  }

  async cancelSubscription(subscriptionId) {
    return this.delete(`/subscriptions/${subscriptionId}`);
  }

  async getSubscriptionPlans() {
    return this.get('/subscriptions/plans');
  }

  // Payment endpoints
  async createPaymentIntent(paymentData) {
    return this.post('/payments/create-intent', paymentData);
  }

  async confirmPayment(paymentIntentId) {
    return this.post(`/payments/confirm/${paymentIntentId}`);
  }

  async getPaymentHistory(params = {}) {
    return this.get('/payments/history', { params });
  }

  // Analytics endpoints
  async getDashboardStats() {
    return this.get('/analytics/dashboard');
  }

  async getPortfolioPerformance(params = {}) {
    return this.get('/analytics/portfolio', { params });
  }

  async getRiskMetrics() {
    return this.get('/analytics/risk');
  }

  async getMarketData(symbol, params = {}) {
    return this.get(`/analytics/market/${symbol}`, { params });
  }

  // File upload
  async uploadFile(file, endpoint = '/upload') {
    const formData = new FormData();
    formData.append('file', file);

    return this.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // WebSocket connection helper
  createWebSocket(endpoint, protocols = []) {
    const wsUrl = BASE_URL.replace('http', 'ws') + endpoint;
    const token = localStorage.getItem('token');
    
    const ws = new WebSocket(wsUrl, protocols);
    
    // Send auth token after connection
    ws.addEventListener('open', () => {
      if (token) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    });

    return ws;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export default
export default apiService;