import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Refresh,
  Settings,
  PlayArrow,
  Stop,
  Dashboard as DashboardIcon,
  Notifications,
  Logout
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

import SignalsList from './SignalsList';
import AccountOverview from './AccountOverview';
import TradingBotStatus from './TradingBotStatus';
import MarketSentiment from './MarketSentiment';
import PortfolioManagement from './PortfolioManagement';
import AdvancedTrading from '../Trading/AdvancedTrading';
import AIBotStatus from '../Trading/AIBotStatus';
import ThemeToggle from '../Common/ThemeToggle';
import { useAuth } from '../Auth/AuthProvider';
import websocketService, { useWebSocket } from '../../services/websocketService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { connectionStatus, connect } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    accountSummary: [],
    recentSignals: [],
    performance: {},
    marketSentiment: {},
    botStatus: {}
  });
  const [marketData, setMarketData] = useState([]);
  const [tradingSignals, setTradingSignals] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - will be replaced with real API calls
      const mockData = {
        accountSummary: [
          {
            id: 1,
            balance: 50000,
            equity: 48500,
            margin: 2500,
            free_margin: 46000,
            profit: -1500,
            currency: 'USD',
            leverage: 100,
            server: 'Demo Server'
          }
        ],
        recentSignals: [
          {
            id: 1,
            symbol: 'EURUSD',
            type: 'BUY',
            confidence: 0.85,
            status: 'active',
            entry_price: 1.0850,
            stop_loss: 1.0820,
            take_profit: 1.0900,
            timestamp: new Date().toISOString()
          }
        ],
        performance: {
          accuracy: 78.5,
          total_trades: 156,
          winning_trades: 122,
          profit_factor: 1.45
        },
        marketSentiment: {
          overall_sentiment: 'bullish',
          bullish_signals: 12,
          bearish_signals: 8,
          neutral_signals: 5
        },
        botStatus: {
          status: 'running',
          uptime: '2d 14h 32m',
          trades_today: 8,
          profit_today: 245.50
        }
      };
      
      setDashboardData(mockData);
      setTradingSignals(mockData.recentSignals);
      setPortfolioData(mockData.accountSummary[0]);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up WebSocket listeners
  useEffect(() => {
    const unsubscribeMarket = websocketService.addListener('market_overview', (data) => {
      setMarketData(data);
    });

    const unsubscribeSignals = websocketService.addListener('trading_signals', (data) => {
      setTradingSignals(data);
      setDashboardData(prev => ({
        ...prev,
        recentSignals: data
      }));
      // Add notification for new signals
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: `${data.length} new trading signals received`,
        type: 'info',
        timestamp: new Date()
      }]);
    });

    const unsubscribePortfolio = websocketService.addListener('portfolio_update', (data) => {
      setPortfolioData(data);
      setDashboardData(prev => ({
        ...prev,
        accountSummary: [data]
      }));
    });

    const unsubscribePriceUpdate = websocketService.addListener('price_update', ({ symbol, data }) => {
      // Update market data with new price
      setMarketData(prev => prev.map(item => 
        item.symbol === symbol 
          ? { ...item, price: data.bid, timestamp: data.timestamp }
          : item
      ));
    });

    const unsubscribeConnectionFailed = websocketService.addListener('connection_failed', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        type: 'error',
        timestamp: new Date()
      }]);
    });

    return () => {
      unsubscribeMarket();
      unsubscribeSignals();
      unsubscribePortfolio();
      unsubscribePriceUpdate();
      unsubscribeConnectionFailed();
    };
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Performance chart data
  const performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [10000, 10500, 10200, 11000, 10800, 11500],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Signal distribution chart data
  const signalDistributionData = {
    labels: ['Buy Signals', 'Sell Signals', 'Hold'],
    datasets: [
      {
        data: [
          dashboardData.marketSentiment?.bullish_signals || 0,
          dashboardData.marketSentiment?.bearish_signals || 0,
          dashboardData.marketSentiment?.neutral_signals || 0
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(158, 158, 158, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(158, 158, 158, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    if (connectionStatus.connected) {
      websocketService.requestSignals();
      websocketService.requestPortfolio();
    } else {
      connect();
    }
    loadDashboardData();
  };

  const handleLogout = () => {
    logout();
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Trading Platform
          </Typography>
          
          {/* Connection Status */}
          <Chip
            label={connectionStatus.connected ? 'Connected' : 'Disconnected'}
            color={connectionStatus.connected ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />
          
          <IconButton color="inherit" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
          
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          
          <ThemeToggle />
          
          <Typography variant="body2" sx={{ mx: 2 }}>
            Welcome, {user?.name || user?.email}
          </Typography>
          
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Box sx={{ p: 2 }}>
          {notifications.slice(-3).map((notification) => (
            <Alert
              key={notification.id}
              severity={notification.type}
              onClose={() => dismissNotification(notification.id)}
              sx={{ mb: 1 }}
            >
              {notification.message}
            </Alert>
          ))}
        </Box>
      )}

      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Trading Dashboard
          </Typography>
        </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Balance
                  </Typography>
                  <Typography variant="h5" component="div">
                    ${dashboardData.accountSummary?.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString() || '0'}
                  </Typography>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Signals
                  </Typography>
                  <Typography variant="h5" component="div">
                    {dashboardData.recentSignals?.filter(s => s.status === 'active').length || 0}
                  </Typography>
                </Box>
                <ShowChart color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Win Rate
                  </Typography>
                  <Typography variant="h5" component="div">
                    {dashboardData.performance?.accuracy || 0}%
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Market Sentiment
                  </Typography>
                  <Typography variant="h6" component="div">
                    <Chip
                      label={dashboardData.marketSentiment?.overall_sentiment || 'Neutral'}
                      color={
                        dashboardData.marketSentiment?.overall_sentiment === 'bullish' ? 'success' :
                        dashboardData.marketSentiment?.overall_sentiment === 'bearish' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </Typography>
                </Box>
                {dashboardData.marketSentiment?.overall_sentiment === 'bullish' ? (
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                ) : (
                  <TrendingDown color="error" sx={{ fontSize: 40 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Signals" />
            <Tab label="Accounts" />
            <Tab label="Trading Bot" />
            <Tab label="Portfolio" />
            <Tab label="Advanced Trading" />
            <Tab label="AI Bot Status" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Performance Chart */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Portfolio Performance
                </Typography>
                <Box height={300}>
                  <Line
                    data={performanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Portfolio Value Over Time'
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>

              {/* Signal Distribution */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Signal Distribution
                </Typography>
                <Box height={300}>
                  <Doughnut
                    data={signalDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>

              {/* Recent Activity */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Recent Signals
                </Typography>
                <SignalsList signals={dashboardData.recentSignals?.slice(0, 5) || []} compact />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <SignalsList signals={tradingSignals || []} />
          )}

          {activeTab === 2 && (
            <AccountOverview accounts={dashboardData.accountSummary || []} />
          )}

          {activeTab === 3 && (
            <TradingBotStatus botStatus={dashboardData.botStatus} />
          )}

          {activeTab === 4 && (
            <PortfolioManagement data={portfolioData} />
          )}

          {activeTab === 5 && (
            <AdvancedTrading />
          )}

          {activeTab === 6 && (
            <AIBotStatus />
          )}

          {activeTab === 7 && (
            <MarketSentiment sentiment={dashboardData.marketSentiment} />
          )}
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;