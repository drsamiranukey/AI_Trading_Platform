import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Notifications,
  NotificationsOff,
  Speed,
  Timeline,
  Star,
  StarBorder,
  PlayArrow,
  Stop,
  Refresh,
  Info,
  CheckCircle,
  Schedule,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTradingWebSocket } from '../../hooks/useWebSocket';

const LiveSignals = () => {
  const [liveSignals, setLiveSignals] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const audioRef = useRef(null);

  // WebSocket connection for live signals
  const { 
    lastMessage, 
    connectionState, 
    sendMessage,
    connect,
    disconnect 
  } = useTradingWebSocket('ws://localhost:8765');

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;

    // Connect to WebSocket on component mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    setIsConnected(connectionState === 'Open');
    setConnectionStatus(connectionState.toLowerCase());
  }, [connectionState]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        if (data.type === 'trading_signal') {
          const newSignal = {
            id: data.signal.id || Date.now(),
            symbol: data.signal.symbol,
            signal_type: data.signal.signal_type,
            entry_price: data.signal.entry_price,
            target_price: data.signal.target_price,
            stop_loss: data.signal.stop_loss,
            confidence: data.signal.confidence_score,
            timeframe: data.signal.timeframe,
            strategy: data.signal.strategy_name,
            status: data.signal.status || 'active',
            created_at: new Date(data.signal.created_at || Date.now()),
            risk_reward: data.signal.risk_reward_ratio,
            analysis: data.signal.analysis_data,
            priority: data.signal.priority || 'medium'
          };

          setLiveSignals(prev => {
            // Remove duplicates and add new signal at the top
            const filtered = prev.filter(signal => signal.id !== newSignal.id);
            const updated = [newSignal, ...filtered].slice(0, 50); // Keep last 50 signals
            return updated;
          });

          // Play notification sound if enabled
          if (notifications && audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
          }

          // Show browser notification if permission granted
          if (notifications && Notification.permission === 'granted') {
            new Notification(`New ${newSignal.signal_type.toUpperCase()} Signal`, {
              body: `${newSignal.symbol} - Confidence: ${(newSignal.confidence * 100).toFixed(1)}%`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, notifications]);

  const handleToggleNotifications = () => {
    if (!notifications && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotifications(true);
        }
      });
    } else {
      setNotifications(!notifications);
    }
  };

  const handleViewDetails = (signal) => {
    setSelectedSignal(signal);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSignal(null);
  };

  const getSignalTypeIcon = (type) => {
    return type === 'buy' ? <TrendingUp /> : <TrendingDown />;
  };

  const getSignalTypeColor = (type) => {
    return type === 'buy' ? 'success' : 'error';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'executed': return 'success';
      case 'expired': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayArrow />;
      case 'executed': return <CheckCircle />;
      case 'expired': return <Schedule />;
      case 'cancelled': return <ErrorIcon />;
      default: return <Schedule />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const formatPrice = (price) => {
    return price ? price.toFixed(5) : 'N/A';
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return format(date, 'MMM dd, HH:mm');
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" component="h1">
                Live Trading Signals
              </Typography>
              <Badge
                color={isConnected ? 'success' : 'error'}
                variant="dot"
                sx={{ ml: 1 }}
              >
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  size="small"
                />
              </Badge>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications}
                    onChange={handleToggleNotifications}
                    color="primary"
                  />
                }
                label="Notifications"
              />
              <Tooltip title="Refresh Connection">
                <IconButton onClick={() => window.location.reload()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            <Typography variant="body2">
              Connecting to live signal feed... Status: {connectionStatus}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Live Signals List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Signals ({liveSignals.length})
          </Typography>
          
          {liveSignals.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Speed sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Waiting for live signals...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {isConnected ? 'Connected and monitoring the market' : 'Connecting to signal feed'}
              </Typography>
            </Box>
          ) : (
            <List>
              {liveSignals.map((signal, index) => (
                <React.Fragment key={signal.id}>
                  <ListItem
                    sx={{
                      border: `2px solid ${getPriorityColor(signal.priority)}20`,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: signal.priority === 'high' ? 'rgba(244, 67, 54, 0.05)' : 'transparent'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getSignalTypeColor(signal.signal_type) === 'success' ? 'success.main' : 'error.main'
                        }}
                      >
                        {getSignalTypeIcon(signal.signal_type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {signal.symbol}
                          </Typography>
                          <Chip
                            label={signal.signal_type.toUpperCase()}
                            color={getSignalTypeColor(signal.signal_type)}
                            size="small"
                          />
                          <Chip
                            label={formatConfidence(signal.confidence)}
                            color={signal.confidence > 0.8 ? 'success' : signal.confidence > 0.6 ? 'warning' : 'default'}
                            size="small"
                          />
                          {signal.priority === 'high' && (
                            <Chip
                              label="HIGH PRIORITY"
                              color="error"
                              size="small"
                              icon={<Star />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Entry: {formatPrice(signal.entry_price)} | 
                            Target: {formatPrice(signal.target_price)} | 
                            SL: {formatPrice(signal.stop_loss)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {signal.timeframe} • {signal.strategy} • {getTimeAgo(signal.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={signal.status}
                          color={getStatusColor(signal.status)}
                          size="small"
                          icon={getStatusIcon(signal.status)}
                        />
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(signal)}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < liveSignals.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Signal Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              Signal Details - {selectedSignal?.symbol}
            </Typography>
            <Chip
              icon={getSignalTypeIcon(selectedSignal?.signal_type)}
              label={selectedSignal?.signal_type?.toUpperCase()}
              color={getSignalTypeColor(selectedSignal?.signal_type)}
              size="small"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedSignal && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Price Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2">
                    <strong>Entry Price:</strong> {formatPrice(selectedSignal.entry_price)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Target Price:</strong> {formatPrice(selectedSignal.target_price)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stop Loss:</strong> {formatPrice(selectedSignal.stop_loss)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Risk/Reward:</strong> {selectedSignal.risk_reward ? `1:${selectedSignal.risk_reward.toFixed(2)}` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Signal Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2">
                    <strong>Confidence:</strong> {formatConfidence(selectedSignal.confidence)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timeframe:</strong> {selectedSignal.timeframe}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Strategy:</strong> {selectedSignal.strategy}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Priority:</strong> {selectedSignal.priority?.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {format(selectedSignal.created_at, 'MMM dd, yyyy HH:mm:ss')}
                  </Typography>
                </Box>
              </Grid>
              
              {selectedSignal.analysis && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    AI Analysis
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2">
                      {typeof selectedSignal.analysis === 'string' 
                        ? selectedSignal.analysis 
                        : JSON.stringify(selectedSignal.analysis, null, 2)
                      }
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveSignals;