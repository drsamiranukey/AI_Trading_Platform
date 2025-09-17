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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Check,
  Cancel,
  Upgrade,
  Download,
  Receipt,
  CreditCard,
  Warning,
  Info
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subResponse, usageResponse, invoicesResponse] = await Promise.all([
        apiService.getCurrentSubscription(),
        apiService.getSubscriptionUsage(),
        apiService.getInvoices()
      ]);

      setSubscription(subResponse.data);
      setUsage(usageResponse.data);
      setInvoices(invoicesResponse.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load subscription data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await apiService.cancelSubscription();
      setMessage({ type: 'success', text: 'Subscription cancelled successfully. You can continue using the service until the end of your billing period.' });
      setCancelDialog(false);
      await loadSubscriptionData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to cancel subscription' });
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await apiService.reactivateSubscription();
      setMessage({ type: 'success', text: 'Subscription reactivated successfully!' });
      await loadSubscriptionData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reactivate subscription' });
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await apiService.downloadInvoice(invoiceId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download invoice' });
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'cancelled': return 'warning';
      case 'past_due': return 'error';
      case 'unpaid': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription details..." />;
  }

  if (!subscription) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          You don't have an active subscription. <Button href="/subscription">Subscribe now</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Current Plan */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Current Plan: {subscription.planName}
                </Typography>
                <Chip
                  label={subscription.status}
                  color={getStatusColor(subscription.status)}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" color="primary">
                  ${subscription.amount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  per {subscription.interval}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Next billing date
                </Typography>
                <Typography variant="body1">
                  {subscription.nextBillingDate ? 
                    format(new Date(subscription.nextBillingDate), 'MMM dd, yyyy') : 
                    'N/A'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Started on
                </Typography>
                <Typography variant="body1">
                  {format(new Date(subscription.startDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {subscription.status === 'active' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              )}
              
              {subscription.status === 'cancelled' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleReactivateSubscription}
                >
                  Reactivate Subscription
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<Upgrade />}
                href="/subscription"
              >
                Upgrade Plan
              </Button>
            </Box>
          </Paper>

          {/* Usage Statistics */}
          {usage && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Usage This Month
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trading Signals
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">
                        {usage.signals.used}
                        {usage.signals.limit !== -1 && ` / ${usage.signals.limit}`}
                      </Typography>
                      {usage.signals.limit === -1 && (
                        <Chip label="Unlimited" size="small" color="success" />
                      )}
                    </Box>
                    {usage.signals.limit !== -1 && (
                      <LinearProgress
                        variant="determinate"
                        value={getUsagePercentage(usage.signals.used, usage.signals.limit)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      MT5 Accounts
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">
                        {usage.accounts.used}
                        {usage.accounts.limit !== -1 && ` / ${usage.accounts.limit}`}
                      </Typography>
                      {usage.accounts.limit === -1 && (
                        <Chip label="Unlimited" size="small" color="success" />
                      )}
                    </Box>
                    {usage.accounts.limit !== -1 && (
                      <LinearProgress
                        variant="determinate"
                        value={getUsagePercentage(usage.accounts.used, usage.accounts.limit)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Custom Strategies
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">
                        {usage.strategies.used}
                        {usage.strategies.limit !== -1 && ` / ${usage.strategies.limit}`}
                      </Typography>
                      {usage.strategies.limit === -1 && (
                        <Chip label="Unlimited" size="small" color="success" />
                      )}
                    </Box>
                    {usage.strategies.limit !== -1 && (
                      <LinearProgress
                        variant="determinate"
                        value={getUsagePercentage(usage.strategies.used, usage.strategies.limit)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>

        {/* Plan Features */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Plan Features
            </Typography>
            <List dense>
              {subscription.features?.map((feature, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Check color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Payment Method */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            {subscription.paymentMethod ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CreditCard />
                <Box>
                  <Typography variant="body1">
                    **** **** **** {subscription.paymentMethod.last4}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {subscription.paymentMethod.brand} • Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No payment method on file
              </Typography>
            )}
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              startIcon={<CreditCard />}
            >
              Update Payment Method
            </Button>
          </Paper>
        </Grid>

        {/* Billing History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Billing History
            </Typography>
            
            {invoices.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {format(new Date(invoice.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={invoice.status === 'paid' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<Download />}
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No billing history available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Cancel Subscription
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel your subscription?
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Your subscription will remain active until {subscription.nextBillingDate ? 
                format(new Date(subscription.nextBillingDate), 'MMM dd, yyyy') : 
                'the end of your billing period'
              }. You can reactivate anytime before then.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ mt: 2 }}>
            You'll lose access to:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Premium trading signals" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Advanced AI analysis" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Priority support" />
            </ListItem>
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelSubscription}
            color="error"
            variant="contained"
          >
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionManagement;