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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Notifications,
  NotificationsOff,
  Star,
  StarBorder,
  Refresh,
  FilterList,
  Timeline,
  AccountBalance,
  Speed,
  Assessment,
  PlayArrow,
  Stop,
  Settings,
  Info,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const TradingSignals = () => {
  const { user } = useAuth();
  const [signals, setSignals] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterDialog, setFilterDialog] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  
  const [filters, setFilters] = useState({
    provider: '',
    instrument: '',
    signal_type: '',
    status: '',
    date_range: '7d'
  });

  const [stats, setStats] = useState({
    total_signals: 0,
    active_signals: 0,
    successful_signals: 0,
    win_rate: 0,
    total_pips: 0,
    subscribed_providers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [signalsRes, providersRes, subscriptionsRes, statsRes] = await Promise.all([
        apiService.getTradingSignals(),
        apiService.getSignalProviders(),
        apiService.getSignalSubscriptions(),
        apiService.getSignalStats()
      ]);
      
      setSignals(signalsRes.data || []);
      setProviders(providersRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
      setStats(statsRes.data || stats);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch trading signals data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeProvider = async (providerId) => {
    try {
      await apiService.subscribeToProvider(providerId);
      setMessage({ type: 'success', text: 'Successfully subscribed to provider' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to subscribe to provider' });
    }
  };

  const handleUnsubscribeProvider = async (providerId) => {
    try {
      await apiService.unsubscribeFromProvider(providerId);
      setMessage({ type: 'success', text: 'Successfully unsubscribed from provider' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unsubscribe from provider' });
    }
  };

  const handleToggleNotifications = async (signalId, enabled) => {
    try {
      await apiService.updateSignalNotifications(signalId, enabled);
      setMessage({ type: 'success', text: `Notifications ${enabled ? 'enabled' : 'disabled'}` });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update notifications' });
    }
  };

  const getSignalTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'buy': return 'success';
      case 'sell': return 'error';
      case 'hold': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Schedule />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'pending': return <Schedule />;
      default: return <Info />;
    }
  };

  const formatPips = (pips) => {
    if (!pips) return 'N/A';
    const sign = pips >= 0 ? '+' : '';
    return `${sign}${pips} pips`;
  };

  const isSubscribed = (providerId) => {
    return subscriptions.some(sub => sub.provider_id === providerId && sub.active);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Trading Signals</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterDialog(true)}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Refresh
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
                <Timeline color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.total_signals}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Signals
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
                <PlayArrow color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.active_signals}</Typography>
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
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.successful_signals}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful
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
                <Assessment color="success" sx={{ mr: 2 }} />
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
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{formatPips(stats.total_pips)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Pips
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
                <AccountBalance color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.subscribed_providers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Signal Providers */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Signal Providers
            </Typography>
            <List>
              {providers.map((provider) => (
                <ListItem key={provider.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {provider.name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={provider.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Win Rate: {provider.win_rate}% | Signals: {provider.total_signals}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          {[...Array(5)].map((_, i) => (
                            i < Math.floor(provider.rating || 0) ? 
                            <Star key={i} sx={{ fontSize: 16, color: 'gold' }} /> :
                            <StarBorder key={i} sx={{ fontSize: 16, color: 'grey.400' }} />
                          ))}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            ({provider.rating || 0})
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant={isSubscribed(provider.id) ? "outlined" : "contained"}
                      onClick={() => isSubscribed(provider.id) ? 
                        handleUnsubscribeProvider(provider.id) : 
                        handleSubscribeProvider(provider.id)
                      }
                    >
                      {isSubscribed(provider.id) ? 'Unsubscribe' : 'Subscribe'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {providers.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No providers available"
                    secondary="Check back later for signal providers"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Trading Signals */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Recent Signals
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Instrument</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Entry</TableCell>
                    <TableCell>TP/SL</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pips</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : signals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No trading signals found. Subscribe to providers to receive signals.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    signals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                              {signal.provider_name?.charAt(0)}
                            </Avatar>
                            {signal.provider_name}
                          </Box>
                        </TableCell>
                        <TableCell>{signal.instrument}</TableCell>
                        <TableCell>
                          <Chip
                            label={signal.signal_type}
                            color={getSignalTypeColor(signal.signal_type)}
                            size="small"
                            icon={signal.signal_type?.toLowerCase() === 'buy' ? <TrendingUp /> : <TrendingDown />}
                          />
                        </TableCell>
                        <TableCell>{signal.entry_price}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              TP: {signal.take_profit || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              SL: {signal.stop_loss || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={signal.status}
                            color={getStatusColor(signal.status)}
                            size="small"
                            icon={getStatusIcon(signal.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={signal.pips >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatPips(signal.pips)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={signal.notifications_enabled ? "Disable Notifications" : "Enable Notifications"}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleNotifications(signal.id, !signal.notifications_enabled)}
                            >
                              {signal.notifications_enabled ? <Notifications /> : <NotificationsOff />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Signals</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={filters.provider}
                  onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                >
                  <MenuItem value="">All Providers</MenuItem>
                  {providers.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Signal Type</InputLabel>
                <Select
                  value={filters.signal_type}
                  onChange={(e) => setFilters({ ...filters, signal_type: e.target.value })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                  <MenuItem value="hold">Hold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                >
                  <MenuItem value="1d">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instrument"
                value={filters.instrument}
                onChange={(e) => setFilters({ ...filters, instrument: e.target.value })}
                placeholder="e.g., EURUSD, GBPUSD"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setFilterDialog(false);
              fetchData();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TradingSignals;