import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Settings,
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  TrendingDown,
  Speed,
  AccountBalance,
  Assessment,
  Timeline,
  SmartToy,
  Psychology,
  AutoAwesome,
  Refresh,
  Download,
  Upload,
  Save,
  RestoreFromTrash,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const TradingBot = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [botPerformance, setBotPerformance] = useState({});

  const [botConfig, setBotConfig] = useState({
    name: '',
    strategy: 'scalping',
    risk_level: 2,
    max_drawdown: 10,
    take_profit: 50,
    stop_loss: 25,
    lot_size: 0.1,
    max_trades: 5,
    trading_hours: {
      start: '09:00',
      end: '17:00'
    },
    instruments: ['EURUSD'],
    enabled: false,
    auto_restart: true,
    notifications: true
  });

  const [stats, setStats] = useState({
    total_bots: 0,
    active_bots: 0,
    total_trades: 0,
    profitable_trades: 0,
    total_profit: 0,
    win_rate: 0
  });

  const strategies = [
    { value: 'scalping', label: 'Scalping', description: 'Quick trades for small profits' },
    { value: 'swing', label: 'Swing Trading', description: 'Medium-term position trading' },
    { value: 'trend_following', label: 'Trend Following', description: 'Follow market trends' },
    { value: 'mean_reversion', label: 'Mean Reversion', description: 'Trade against extremes' },
    { value: 'arbitrage', label: 'Arbitrage', description: 'Exploit price differences' },
    { value: 'grid', label: 'Grid Trading', description: 'Place orders at regular intervals' }
  ];

  const instruments = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
    'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURNZD'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [botsRes, statsRes, performanceRes] = await Promise.all([
        apiService.getTradingBots(),
        apiService.getBotStats(),
        apiService.getBotPerformance()
      ]);
      
      setBots(botsRes.data || []);
      setStats(statsRes.data || stats);
      setBotPerformance(performanceRes.data || {});
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch trading bot data' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async (botId) => {
    try {
      await apiService.startTradingBot(botId);
      setMessage({ type: 'success', text: 'Trading bot started successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start trading bot' });
    }
  };

  const handleStopBot = async (botId) => {
    try {
      await apiService.stopTradingBot(botId);
      setMessage({ type: 'success', text: 'Trading bot stopped successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to stop trading bot' });
    }
  };

  const handleCreateBot = () => {
    setEditingBot(null);
    setBotConfig({
      name: '',
      strategy: 'scalping',
      risk_level: 2,
      max_drawdown: 10,
      take_profit: 50,
      stop_loss: 25,
      lot_size: 0.1,
      max_trades: 5,
      trading_hours: {
        start: '09:00',
        end: '17:00'
      },
      instruments: ['EURUSD'],
      enabled: false,
      auto_restart: true,
      notifications: true
    });
    setOpenDialog(true);
  };

  const handleEditBot = (bot) => {
    setEditingBot(bot);
    setBotConfig({
      name: bot.name || '',
      strategy: bot.strategy || 'scalping',
      risk_level: bot.risk_level || 2,
      max_drawdown: bot.max_drawdown || 10,
      take_profit: bot.take_profit || 50,
      stop_loss: bot.stop_loss || 25,
      lot_size: bot.lot_size || 0.1,
      max_trades: bot.max_trades || 5,
      trading_hours: bot.trading_hours || { start: '09:00', end: '17:00' },
      instruments: bot.instruments || ['EURUSD'],
      enabled: bot.enabled || false,
      auto_restart: bot.auto_restart || true,
      notifications: bot.notifications || true
    });
    setOpenDialog(true);
  };

  const handleSaveBot = async () => {
    try {
      if (editingBot) {
        await apiService.updateTradingBot(editingBot.id, botConfig);
        setMessage({ type: 'success', text: 'Trading bot updated successfully' });
      } else {
        await apiService.createTradingBot(botConfig);
        setMessage({ type: 'success', text: 'Trading bot created successfully' });
      }
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save trading bot' });
    }
  };

  const handleDeleteBot = async (botId) => {
    if (window.confirm('Are you sure you want to delete this trading bot?')) {
      try {
        await apiService.deleteTradingBot(botId);
        setMessage({ type: 'success', text: 'Trading bot deleted successfully' });
        fetchData();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete trading bot' });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'success';
      case 'stopped': return 'error';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return <PlayArrow />;
      case 'stopped': return <Stop />;
      case 'paused': return <Warning />;
      case 'error': return <ErrorIcon />;
      default: return <Info />;
    }
  };

  const getRiskLevelText = (level) => {
    const levels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return levels[level - 1] || 'Medium';
  };

  const getRiskLevelColor = (level) => {
    if (level <= 2) return 'success';
    if (level <= 3) return 'warning';
    return 'error';
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Trading Bots</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateBot}
          >
            Create Bot
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SmartToy color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.total_bots}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bots
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PlayArrow color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.active_bots}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.total_trades}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Trades
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.profitable_trades}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profitable
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">${stats.total_profit?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.win_rate}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Win Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Active Bots" />
          <Tab label="Performance" />
          <Tab label="Settings" />
        </Tabs>

        {/* Active Bots Tab */}
        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center">
                  <CircularProgress />
                </Box>
              </Grid>
            ) : bots.length === 0 ? (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <SmartToy sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No trading bots found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first trading bot to get started
                  </Typography>
                  <Button variant="contained" onClick={handleCreateBot}>
                    Create Bot
                  </Button>
                </Box>
              </Grid>
            ) : (
              bots.map((bot) => (
                <Grid item xs={12} md={6} lg={4} key={bot.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6">{bot.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {strategies.find(s => s.value === bot.strategy)?.label || bot.strategy}
                          </Typography>
                        </Box>
                        <Chip
                          label={bot.status}
                          color={getStatusColor(bot.status)}
                          size="small"
                          icon={getStatusIcon(bot.status)}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Risk Level
                        </Typography>
                        <Chip
                          label={getRiskLevelText(bot.risk_level)}
                          color={getRiskLevelColor(bot.risk_level)}
                          size="small"
                        />
                      </Box>

                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Performance
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Profit: ${bot.total_profit?.toLocaleString() || '0'}
                          </Typography>
                          <Typography variant="body2">
                            Trades: {bot.total_trades || 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((bot.win_rate || 0), 100)}
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Win Rate: {bot.win_rate || 0}%
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" gap={1}>
                          {bot.status === 'running' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Stop />}
                              onClick={() => handleStopBot(bot.id)}
                            >
                              Stop
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<PlayArrow />}
                              onClick={() => handleStartBot(bot.id)}
                            >
                              Start
                            </Button>
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditBot(bot)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteBot(bot.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Bot Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed performance metrics and analytics will be displayed here.
          </Typography>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Global Bot Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure global settings for all trading bots.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Create/Edit Bot Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBot ? 'Edit Trading Bot' : 'Create Trading Bot'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bot Name"
                value={botConfig.name}
                onChange={(e) => setBotConfig({ ...botConfig, name: e.target.value })}
                placeholder="My Trading Bot"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={botConfig.strategy}
                  onChange={(e) => setBotConfig({ ...botConfig, strategy: e.target.value })}
                >
                  {strategies.map((strategy) => (
                    <MenuItem key={strategy.value} value={strategy.value}>
                      {strategy.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Risk Level: {getRiskLevelText(botConfig.risk_level)}</Typography>
              <Slider
                value={botConfig.risk_level}
                onChange={(e, value) => setBotConfig({ ...botConfig, risk_level: value })}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Take Profit (pips)"
                value={botConfig.take_profit}
                onChange={(e) => setBotConfig({ ...botConfig, take_profit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Stop Loss (pips)"
                value={botConfig.stop_loss}
                onChange={(e) => setBotConfig({ ...botConfig, stop_loss: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Lot Size"
                value={botConfig.lot_size}
                onChange={(e) => setBotConfig({ ...botConfig, lot_size: Number(e.target.value) })}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Drawdown (%)"
                value={botConfig.max_drawdown}
                onChange={(e) => setBotConfig({ ...botConfig, max_drawdown: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Concurrent Trades"
                value={botConfig.max_trades}
                onChange={(e) => setBotConfig({ ...botConfig, max_trades: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Trading Start Time"
                value={botConfig.trading_hours.start}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  trading_hours: { ...botConfig.trading_hours, start: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Trading End Time"
                value={botConfig.trading_hours.end}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  trading_hours: { ...botConfig.trading_hours, end: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trading Instruments</InputLabel>
                <Select
                  multiple
                  value={botConfig.instruments}
                  onChange={(e) => setBotConfig({ ...botConfig, instruments: e.target.value })}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {instruments.map((instrument) => (
                    <MenuItem key={instrument} value={instrument}>
                      {instrument}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={botConfig.auto_restart}
                    onChange={(e) => setBotConfig({ ...botConfig, auto_restart: e.target.checked })}
                  />
                }
                label="Auto Restart on Error"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={botConfig.notifications}
                    onChange={(e) => setBotConfig({ ...botConfig, notifications: e.target.checked })}
                  />
                }
                label="Enable Notifications"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveBot}
            variant="contained"
            disabled={!botConfig.name || botConfig.instruments.length === 0}
          >
            {editingBot ? 'Update' : 'Create'} Bot
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TradingBot;