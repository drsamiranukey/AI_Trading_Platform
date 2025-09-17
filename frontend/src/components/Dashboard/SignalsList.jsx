import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  PlayArrow,
  Stop,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';

const SignalsList = ({ signals = [], compact = false }) => {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getSignalTypeColor = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      case 'hold':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSignalTypeIcon = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'executed':
        return 'info';
      case 'expired':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toFixed(4)}` : 'N/A';
  };

  const formatPercentage = (value) => {
    return value ? `${parseFloat(value).toFixed(2)}%` : 'N/A';
  };

  if (compact) {
    return (
      <Box>
        {signals.length === 0 ? (
          <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
            No signals available
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {signals.map((signal) => (
              <Grid item xs={12} sm={6} md={4} key={signal.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="div">
                        {signal.symbol}
                      </Typography>
                      <Chip
                        icon={getSignalTypeIcon(signal.signal_type)}
                        label={signal.signal_type?.toUpperCase()}
                        color={getSignalTypeColor(signal.signal_type)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {formatPrice(signal.entry_price)} • {formatPercentage(signal.confidence)}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={signal.status?.toUpperCase()}
                        color={getStatusColor(signal.status)}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(signal)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Target Price</TableCell>
              <TableCell>Stop Loss</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary" py={2}>
                    No signals available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              signals.map((signal) => (
                <TableRow key={signal.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {signal.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getSignalTypeIcon(signal.signal_type)}
                      label={signal.signal_type?.toUpperCase()}
                      color={getSignalTypeColor(signal.signal_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatPrice(signal.entry_price)}</TableCell>
                  <TableCell>{formatPrice(signal.target_price)}</TableCell>
                  <TableCell>{formatPrice(signal.stop_loss)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatPercentage(signal.confidence)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={signal.status?.toUpperCase()}
                      color={getStatusColor(signal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {signal.created_at ? format(new Date(signal.created_at), 'MMM dd, HH:mm') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(signal)}
                      color="primary"
                    >
                      <Info />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
                    <strong>Current Price:</strong> {formatPrice(selectedSignal.current_price)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Signal Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2">
                    <strong>Confidence:</strong> {formatPercentage(selectedSignal.confidence)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Risk Level:</strong> {selectedSignal.risk_level || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timeframe:</strong> {selectedSignal.timeframe || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={selectedSignal.status?.toUpperCase()}
                      color={getStatusColor(selectedSignal.status)}
                      size="small"
                    />
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Analysis
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedSignal.analysis || 'No analysis available'}
                </Typography>
              </Grid>

              {selectedSignal.indicators && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Technical Indicators
                  </Typography>
                  <Box>
                    {Object.entries(selectedSignal.indicators).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        <strong>{key}:</strong> {typeof value === 'number' ? value.toFixed(4) : value}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Timestamps
                </Typography>
                <Typography variant="body2">
                  <strong>Created:</strong>{' '}
                  {selectedSignal.created_at ? format(new Date(selectedSignal.created_at), 'PPpp') : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Updated:</strong>{' '}
                  {selectedSignal.updated_at ? format(new Date(selectedSignal.updated_at), 'PPpp') : 'N/A'}
                </Typography>
                {selectedSignal.expires_at && (
                  <Typography variant="body2">
                    <strong>Expires:</strong>{' '}
                    {format(new Date(selectedSignal.expires_at), 'PPpp')}
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          {selectedSignal?.status === 'active' && (
            <>
              <Button
                startIcon={<PlayArrow />}
                variant="contained"
                color="success"
              >
                Execute Signal
              </Button>
              <Button
                startIcon={<Stop />}
                variant="outlined"
                color="error"
              >
                Cancel Signal
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignalsList;