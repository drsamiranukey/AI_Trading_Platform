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
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Refresh,
  Settings,
  PlayArrow,
  Stop
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
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/api';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    accountSummary: null,
    recentSignals: [],
    marketSentiment: null,
    performance: null,
    botStatus: null
  });

  // WebSocket for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('/ws/dashboard');

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        accountsResponse,
        signalsResponse,
        sentimentResponse,
        performanceResponse
      ] = await Promise.all([
        apiService.get('/mt5/accounts'),
        apiService.get('/signals?limit=10'),
        apiService.get('/signals/analysis/market-sentiment'),
        apiService.get('/signals/performance/stats')
      ]);

      setDashboardData({
        accountSummary: accountsResponse.data,
        recentSignals: signalsResponse.data,
        marketSentiment: sentimentResponse.data,
        performance: performanceResponse.data,
        botStatus: null // Will be loaded separately
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      
      switch (data.type) {
        case 'signal_update':
          setDashboardData(prev => ({
            ...prev,
            recentSignals: [data.signal, ...prev.recentSignals.slice(0, 9)]
          }));
          break;
        case 'account_update':
          setDashboardData(prev => ({
            ...prev,
            accountSummary: prev.accountSummary?.map(acc => 
              acc.id === data.account.id ? { ...acc, ...data.account } : acc
            )
          }));
          break;
        case 'bot_status':
          setDashboardData(prev => ({
            ...prev,
            botStatus: data.status
          }));
          break;
        default:
          break;
      }
    }
  }, [lastMessage]);

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
    loadDashboardData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Trading Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={connectionStatus === 'Connected' ? 'Live' : 'Offline'}
            color={connectionStatus === 'Connected' ? 'success' : 'error'}
            size="small"
          />
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
            <SignalsList signals={dashboardData.recentSignals || []} />
          )}

          {activeTab === 2 && (
            <AccountOverview accounts={dashboardData.accountSummary || []} />
          )}

          {activeTab === 3 && (
            <TradingBotStatus botStatus={dashboardData.botStatus} />
          )}

          {activeTab === 4 && (
            <MarketSentiment sentiment={dashboardData.marketSentiment} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;