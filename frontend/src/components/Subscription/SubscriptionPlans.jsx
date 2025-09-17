import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Check,
  Star,
  TrendingUp,
  Security,
  Speed,
  Support,
  Analytics,
  AutoAwesome
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for beginners',
      monthlyPrice: 29,
      annualPrice: 290,
      popular: false,
      features: [
        'Up to 5 trading signals per day',
        'Basic market analysis',
        'Email notifications',
        'Standard support',
        'Mobile app access',
        'Basic risk management'
      ],
      limits: {
        signals: 5,
        accounts: 1,
        strategies: 2
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Most popular choice',
      monthlyPrice: 79,
      annualPrice: 790,
      popular: true,
      features: [
        'Unlimited trading signals',
        'Advanced AI analysis',
        'Real-time notifications',
        'Priority support',
        'Multiple MT5 accounts',
        'Advanced risk management',
        'Custom strategies',
        'Market sentiment analysis'
      ],
      limits: {
        signals: -1, // unlimited
        accounts: 3,
        strategies: 10
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For serious traders',
      monthlyPrice: 199,
      annualPrice: 1990,
      popular: false,
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom AI model training',
        'API access',
        'White-label solutions',
        'Advanced analytics',
        'Unlimited MT5 accounts',
        'Custom integrations',
        '24/7 phone support'
      ],
      limits: {
        signals: -1,
        accounts: -1,
        strategies: -1
      }
    }
  ];

  const handlePlanSelect = (plan) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to subscribe to a plan' });
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialog(false);
    setMessage({ type: 'success', text: 'Subscription activated successfully!' });
    // Refresh user data to get updated subscription info
    window.location.reload();
  };

  const getPrice = (plan) => {
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getSavings = (plan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.annualPrice;
    return Math.round((savings / monthlyTotal) * 100);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Trading Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Unlock the power of AI-driven trading with our flexible subscription plans
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Annual billing</Typography>
              <Chip
                label="Save up to 20%"
                size="small"
                color="success"
                variant="outlined"
              />
            </Box>
          }
        />
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? 'primary.main' : 'divider',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: plan.popular ? 'scale(1.07)' : 'scale(1.02)',
                  boxShadow: 6
                }
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }}
                >
                  <Chip
                    icon={<Star />}
                    label="Most Popular"
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, pt: plan.popular ? 4 : 3 }}>
                <Typography variant="h4" component="h2" gutterBottom align="center">
                  {plan.name}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  {plan.description}
                </Typography>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" component="div" color="primary">
                    ${getPrice(plan)}
                    <Typography component="span" variant="h6" color="text.secondary">
                      /{isAnnual ? 'year' : 'month'}
                    </Typography>
                  </Typography>
                  {isAnnual && (
                    <Typography variant="body2" color="success.main">
                      Save {getSavings(plan)}% annually
                    </Typography>
                  )}
                </Box>

                <List dense>
                  {plan.features.map((feature, index) => (
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
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant={plan.popular ? 'contained' : 'outlined'}
                  size="large"
                  onClick={() => handlePlanSelect(plan)}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {user?.subscription?.plan === plan.id ? 'Current Plan' : 'Get Started'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Feature Comparison */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Why Choose Our AI Trading Platform?
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI-Powered Signals
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced machine learning algorithms analyze market data 24/7
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Risk Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built-in risk controls to protect your trading capital
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Speed sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-Time Execution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lightning-fast signal delivery and trade execution
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive performance tracking and insights
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Payment Dialog */}
      <Elements stripe={stripePromise}>
        <PaymentDialog
          open={paymentDialog}
          onClose={() => setPaymentDialog(false)}
          plan={selectedPlan}
          isAnnual={isAnnual}
          onSuccess={handlePaymentSuccess}
        />
      </Elements>
    </Container>
  );
};

// Payment Dialog Component
const PaymentDialog = ({ open, onClose, plan, isAnnual, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentError) {
        setError(paymentError.message);
        setLoading(false);
        return;
      }

      // Create subscription
      const response = await apiService.createSubscription({
        planId: plan.id,
        paymentMethodId: paymentMethod.id,
        isAnnual
      });

      if (response.data.requiresAction) {
        // Handle 3D Secure authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          response.data.clientSecret
        );

        if (confirmError) {
          setError(confirmError.message);
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Subscribe to {plan.name} Plan
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ${isAnnual ? plan.annualPrice : plan.monthlyPrice} / {isAnnual ? 'year' : 'month'}
          </Typography>
          {isAnnual && (
            <Typography variant="body2" color="success.main">
              You save ${(plan.monthlyPrice * 12) - plan.annualPrice} annually!
            </Typography>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your subscription will automatically renew. You can cancel anytime from your account settings.
          </Typography>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!stripe || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Processing...' : `Subscribe for $${isAnnual ? plan.annualPrice : plan.monthlyPrice}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionPlans;