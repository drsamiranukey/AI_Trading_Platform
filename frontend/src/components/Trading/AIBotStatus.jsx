import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  SmartToy,
  TrendingUp,
  TrendingDown,
  Pause,
  PlayArrow,
  Settings,
  Analytics,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const AIBotStatus = () => {
  const { user } = useAuth();
  const [botStatus, setBotStatus] = useState({
    isActive: false,
    performance: {
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      dailyProfit: 0,
      activeSignals: 0
    },
    currentSignals: [],
    botConfig: {
      strategy: 'scalping',
      riskLevel: 2,
      maxDailyTrades: 10,
      confidenceThreshold: 0.7
    }
  });
  
  const [configDialog, setConfigDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock real-time bot data (in production, this would come from WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      setBotStatus(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          totalTrades: prev.performance.totalTrades + Math.floor(Math.random() * 2),
          winRate: 65 + Math.random() * 20,
          totalProfit: prev.performance.totalProfit + (Math.random() - 0.5) * 100,
          dailyProfit: prev.performance.dailyProfit + (Math.random() - 0.5) * 50,
          activeSignals: Math.floor(Math.random() * 5) + 1
        },
        currentSignals: generateMockSignals()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateMockSignals = () => {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];
    const types = ['BUY', 'SELL'];
    
    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      id: Date.now() + i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      type: types[Math.floor(Math.random() * types.length)],
      confidence: (0.6 + Math.random() * 0.4).toFixed(2),
      entry: (1.0 + Math.random() * 0.5).toFixed(4),
      timestamp: new Date().toLocaleTimeString()
    }));
  };

  const handleBotToggle = async () => {
    setLoading(true);
    try {
      if (botStatus.isActive) {
        // Stop bot
        await apiService.stopTradingBot('main');
        setBotStatus(prev => ({ ...prev, isActive: false }));
      } else {
        // Start bot
        await apiService.startTradingBot('main');
        setBotStatus(prev => ({ ...prev, isActive: true }));
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
    setLoading(false);
  };

  const handleConfigSave = () => {
    setConfigDialog(false);
    // In production, save config to backend
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy color="primary" />
        AI Trading Bot Status
      </Typography>

      {/* Bot Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={botStatus.isActive}
                      onChange={handleBotToggle}
                      disabled={loading}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {botStatus.isActive ? <CheckCircle color="success" /> : <Pause color="warning" />}
                      <Typography variant="h6">
                        Bot Status: {botStatus.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => setConfigDialog(true)}
                >
                  Configure
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Analytics />}
                >
                  Analytics
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Trades
              </Typography>
              <Typography variant="h4">
                {botStatus.performance.totalTrades}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {botStatus.performance.winRate.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={botStatus.performance.winRate} 
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Profit
              </Typography>
              <Typography 
                variant="h4" 
                color={botStatus.performance.totalProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${botStatus.performance.totalProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Signals
              </Typography>
              <Typography variant="h4" color="primary">
                {botStatus.performance.activeSignals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Signals */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current AI Signals
          </Typography>
          {botStatus.currentSignals.length > 0 ? (
            <List>
              {botStatus.currentSignals.map((signal) => (
                <ListItem key={signal.id} divider>
                  <ListItemIcon>
                    {signal.type === 'BUY' ? 
                      <TrendingUp color="success" /> : 
                      <TrendingDown color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {signal.symbol}
                        </Typography>
                        <Chip 
                          label={signal.type} 
                          color={signal.type === 'BUY' ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip 
                          label={`${(signal.confidence * 100).toFixed(0)}% confidence`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={`Entry: ${signal.entry} | Generated: ${signal.timestamp}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No active signals. The AI bot is analyzing market conditions...
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Bot Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Strategy"
                value={botStatus.botConfig.strategy}
                onChange={(e) => setBotStatus(prev => ({
                  ...prev,
                  botConfig: { ...prev.botConfig, strategy: e.target.value }
                }))}
              >
                <MenuItem value="scalping">Scalping</MenuItem>
                <MenuItem value="swing">Swing Trading</MenuItem>
                <MenuItem value="trend_following">Trend Following</MenuItem>
                <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                fullWidth
                label="Risk Level (1-5)"
                value={botStatus.botConfig.riskLevel}
                onChange={(e) => setBotStatus(prev => ({
                  ...prev,
                  botConfig: { ...prev.botConfig, riskLevel: parseInt(e.target.value) }
                }))}
                inputProps={{ min: 1, max: 5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                fullWidth
                label="Max Daily Trades"
                value={botStatus.botConfig.maxDailyTrades}
                onChange={(e) => setBotStatus(prev => ({
                  ...prev,
                  botConfig: { ...prev.botConfig, maxDailyTrades: parseInt(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                fullWidth
                label="Confidence Threshold"
                value={botStatus.botConfig.confidenceThreshold}
                onChange={(e) => setBotStatus(prev => ({
                  ...prev,
                  botConfig: { ...prev.botConfig, confidenceThreshold: parseFloat(e.target.value) }
                }))}
                inputProps={{ min: 0.5, max: 1, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleConfigSave} variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIBotStatus;