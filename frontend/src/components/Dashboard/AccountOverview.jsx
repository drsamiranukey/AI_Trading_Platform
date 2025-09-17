import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Visibility,
  Settings,
  Refresh,
  Link,
  LinkOff
} from '@mui/icons-material';
import { format } from 'date-fns';

const AccountOverview = ({ accounts = [] }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getConnectionStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'connecting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAccountTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'demo':
        return 'info';
      case 'live':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (account) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedAccount(null);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return value ? `${parseFloat(value).toFixed(2)}%` : '0.00%';
  };

  const calculateEquityPercentage = (equity, balance) => {
    if (!balance || balance === 0) return 0;
    return ((equity || 0) / balance) * 100;
  };

  const calculateMarginLevel = (equity, margin) => {
    if (!margin || margin === 0) return 0;
    return ((equity || 0) / margin) * 100;
  };

  if (accounts.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No MT5 Accounts Connected
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Connect your MT5 account to start trading
        </Typography>
        <Button variant="contained" color="primary">
          Add MT5 Account
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {accounts.map((account) => (
          <Grid item xs={12} md={6} lg={4} key={account.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {/* Account Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="div" gutterBottom>
                      {account.name || `Account ${account.account_number}`}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      #{account.account_number}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                    <Chip
                      label={account.connection_status?.toUpperCase() || 'UNKNOWN'}
                      color={getConnectionStatusColor(account.connection_status)}
                      size="small"
                    />
                    <Chip
                      label={account.account_type?.toUpperCase() || 'UNKNOWN'}
                      color={getAccountTypeColor(account.account_type)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* Balance Information */}
                <Box mb={2}>
                  <Typography variant="h5" component="div" color="primary" gutterBottom>
                    {formatCurrency(account.balance, account.currency)}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      Equity
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(account.equity, account.currency)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      Free Margin
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(account.free_margin, account.currency)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      Margin Level
                    </Typography>
                    <Typography variant="body2">
                      {formatPercentage(calculateMarginLevel(account.equity, account.margin))}
                    </Typography>
                  </Box>
                </Box>

                {/* Equity Progress Bar */}
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      Equity Ratio
                    </Typography>
                    <Typography variant="body2">
                      {formatPercentage(calculateEquityPercentage(account.equity, account.balance))}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(calculateEquityPercentage(account.equity, account.balance), 100)}
                    color={calculateEquityPercentage(account.equity, account.balance) >= 80 ? 'success' : 'warning'}
                  />
                </Box>

                {/* Profit/Loss */}
                {account.profit !== undefined && (
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      P&L
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {account.profit >= 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={account.profit >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(account.profit, account.currency)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Actions */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(account)}
                  >
                    Details
                  </Button>
                  <Box>
                    <IconButton size="small" color="primary">
                      <Refresh />
                    </IconButton>
                    <IconButton size="small">
                      <Settings />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={account.connection_status === 'connected' ? 'error' : 'success'}
                    >
                      {account.connection_status === 'connected' ? <LinkOff /> : <Link />}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Account Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Account Details - {selectedAccount?.name || `#${selectedAccount?.account_number}`}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label={selectedAccount?.connection_status?.toUpperCase()}
                color={getConnectionStatusColor(selectedAccount?.connection_status)}
                size="small"
              />
              <Chip
                label={selectedAccount?.account_type?.toUpperCase()}
                color={getAccountTypeColor(selectedAccount?.account_type)}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedAccount && (
            <Grid container spacing={3}>
              {/* Account Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Account Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Account Number</strong></TableCell>
                      <TableCell>{selectedAccount.account_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Server</strong></TableCell>
                      <TableCell>{selectedAccount.server || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Company</strong></TableCell>
                      <TableCell>{selectedAccount.company || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Currency</strong></TableCell>
                      <TableCell>{selectedAccount.currency || 'USD'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Leverage</strong></TableCell>
                      <TableCell>1:{selectedAccount.leverage || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>

              {/* Financial Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Financial Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Balance</strong></TableCell>
                      <TableCell>{formatCurrency(selectedAccount.balance, selectedAccount.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Equity</strong></TableCell>
                      <TableCell>{formatCurrency(selectedAccount.equity, selectedAccount.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Margin</strong></TableCell>
                      <TableCell>{formatCurrency(selectedAccount.margin, selectedAccount.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Free Margin</strong></TableCell>
                      <TableCell>{formatCurrency(selectedAccount.free_margin, selectedAccount.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Margin Level</strong></TableCell>
                      <TableCell>{formatPercentage(calculateMarginLevel(selectedAccount.equity, selectedAccount.margin))}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Profit/Loss</strong></TableCell>
                      <TableCell>
                        <Typography
                          color={selectedAccount.profit >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatCurrency(selectedAccount.profit, selectedAccount.currency)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>

              {/* Connection Details */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Connection Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Last Connected:</strong>{' '}
                      {selectedAccount.last_connected_at
                        ? format(new Date(selectedAccount.last_connected_at), 'PPpp')
                        : 'Never'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Created:</strong>{' '}
                      {selectedAccount.created_at
                        ? format(new Date(selectedAccount.created_at), 'PPpp')
                        : 'N/A'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Updated:</strong>{' '}
                      {selectedAccount.updated_at
                        ? format(new Date(selectedAccount.updated_at), 'PPpp')
                        : 'N/A'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      <Chip
                        label={selectedAccount.connection_status?.toUpperCase()}
                        color={getConnectionStatusColor(selectedAccount.connection_status)}
                        size="small"
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh Data
          </Button>
          {selectedAccount?.connection_status === 'connected' ? (
            <Button variant="outlined" color="error" startIcon={<LinkOff />}>
              Disconnect
            </Button>
          ) : (
            <Button variant="contained" color="success" startIcon={<Link />}>
              Connect
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountOverview;