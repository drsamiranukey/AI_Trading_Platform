import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Settings,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Speed,
  AccountBalance,
  ShowChart
} from '@mui/icons-material';
import { format } from 'date-fns';

const TradingBotStatus = ({ botStatus = null }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [botSettings, setBotSettings] = useState({
    maxRiskPerTrade: 2,
    maxDailyLoss: 5,
    maxOpenPositions: 5,
    minConfidence: 70,
    autoExecute: true,
    enableStopLoss: true,
    enableTakeProfit: true
  });

  // Mock data if no bot status provided
  const defaultBotStatus = {
    is_running: false,
    status: 'stopped',
    uptime: 0,
    total_trades: 0,
    successful_trades: 0,
    failed_trades: 0,
    total_profit: 0,
    daily_profit: 0,
    current_positions: 0,
    last_signal_time: null,
    risk_metrics: {
      current_drawdown: 0,
      max_drawdown: 0,
      daily_loss: 0,
      risk_per_trade: 2
    },
    performance_metrics: {
      win_rate: 0,
      profit_factor: 0,
      sharpe_ratio: 0,
      avg_trade_duration: 0
    },
    recent_activities: []
  };

  const currentStatus = botStatus || defaultBotStatus;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'paused':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return <CheckCircle />;
      case 'stopped':
        return <Stop />;
      case 'paused':
        return <Warning />;
      case 'error':
        return <Error />;
      default:
        return <Stop />;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const handleStartBot = () => {
    // API call to start bot
    console.log('Starting trading bot...');
  };

  const handleStopBot = () => {
    // API call to stop bot
    console.log('Stopping trading bot...');
  };

  const handlePauseBot = () => {
    // API call to pause bot
    console.log('Pausing trading bot...');
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleSaveSettings = () => {
    // API call to save settings
    console.log('Saving bot settings:', botSettings);
    setSettingsOpen(false);
  };

  const handleSettingChange = (setting, value) => {
    setBotSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <Box>
      {/* Bot Status Header */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h5" component="div" gutterBottom>
                    Trading Bot Status
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(currentStatus.status)}
                    <Chip
                      label={currentStatus.status?.toUpperCase() || 'UNKNOWN'}
                      color={getStatusColor(currentStatus.status)}
                      size="medium"
                    />
                    {currentStatus.is_running && (
                      <Typography variant="body2" color="textSecondary">
                        Running for {formatDuration(currentStatus.uptime)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  {currentStatus.is_running ? (
                    <>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<Warning />}
                        onClick={handlePauseBot}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Stop />}
                        onClick={handleStopBot}
                      >
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrow />}
                      onClick={handleStartBot}
                    >
                      Start Bot
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={handleOpenSettings}
                  >
                    Settings
                  </Button>
                </Box>
              </Box>

              {/* Performance Metrics */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {currentStatus.total_trades}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Trades
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {formatPercentage(currentStatus.performance_metrics?.win_rate)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Win Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography
                      variant="h6"
                      color={currentStatus.total_profit >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(currentStatus.total_profit)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Profit
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="info.main">
                      {currentStatus.current_positions}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Open Positions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Metrics
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Current Drawdown
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatPercentage(currentStatus.risk_metrics?.current_drawdown)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.abs(currentStatus.risk_metrics?.current_drawdown || 0)}
                  color="error"
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Daily Loss
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatPercentage(currentStatus.risk_metrics?.daily_loss)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.abs(currentStatus.risk_metrics?.daily_loss || 0)}
                  color="warning"
                />
              </Box>

              <Typography variant="body2" color="textSecondary">
                Max Drawdown: {formatPercentage(currentStatus.risk_metrics?.max_drawdown)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Bot Activities
          </Typography>
          
          {currentStatus.recent_activities?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>P&L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentStatus.recent_activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.action}
                          size="small"
                          color={activity.action === 'BUY' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{activity.symbol}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.result}
                          size="small"
                          color={activity.result === 'SUCCESS' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={activity.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatCurrency(activity.pnl)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No recent activities. Start the bot to begin automated trading.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bot Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={handleCloseSettings}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Trading Bot Settings</Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Risk Management */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Risk Management
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Max Risk Per Trade: {botSettings.maxRiskPerTrade}%
              </Typography>
              <Slider
                value={botSettings.maxRiskPerTrade}
                onChange={(e, value) => handleSettingChange('maxRiskPerTrade', value)}
                min={0.5}
                max={10}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Max Daily Loss: {botSettings.maxDailyLoss}%
              </Typography>
              <Slider
                value={botSettings.maxDailyLoss}
                onChange={(e, value) => handleSettingChange('maxDailyLoss', value)}
                min={1}
                max={20}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Open Positions"
                type="number"
                value={botSettings.maxOpenPositions}
                onChange={(e) => handleSettingChange('maxOpenPositions', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Min Signal Confidence: {botSettings.minConfidence}%
              </Typography>
              <Slider
                value={botSettings.minConfidence}
                onChange={(e, value) => handleSettingChange('minConfidence', value)}
                min={50}
                max={95}
                step={5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Trading Options */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Trading Options
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={botSettings.autoExecute}
                    onChange={(e) => handleSettingChange('autoExecute', e.target.checked)}
                  />
                }
                label="Auto Execute Signals"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={botSettings.enableStopLoss}
                    onChange={(e) => handleSettingChange('enableStopLoss', e.target.checked)}
                  />
                }
                label="Enable Stop Loss"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={botSettings.enableTakeProfit}
                    onChange={(e) => handleSettingChange('enableTakeProfit', e.target.checked)}
                  />
                }
                label="Enable Take Profit"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseSettings}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingBotStatus;