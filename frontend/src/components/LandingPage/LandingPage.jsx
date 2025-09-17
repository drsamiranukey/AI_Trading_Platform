import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  SmartToy,
  ShowChart,
  Security,
  Speed,
  Analytics,
  AccountBalance,
  Notifications,
  CheckCircle,
  Star,
  Timeline,
  AutoGraph
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Trading',
      description: 'Advanced machine learning algorithms analyze market patterns and generate high-probability trading signals.',
      color: 'primary'
    },
    {
      icon: <ShowChart sx={{ fontSize: 40 }} />,
      title: 'Real-Time Signals',
      description: 'Get instant trading signals with entry points, stop losses, and take profit levels.',
      color: 'success'
    },
    {
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      title: 'MT5 Integration',
      description: 'Seamlessly connect your MetaTrader 5 accounts for automated trade execution.',
      color: 'info'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Risk Management',
      description: 'Built-in risk management tools to protect your capital and optimize position sizing.',
      color: 'warning'
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Performance Analytics',
      description: 'Comprehensive analytics and reporting to track your trading performance.',
      color: 'secondary'
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Lightning Fast',
      description: 'Ultra-low latency execution ensures you never miss a trading opportunity.',
      color: 'error'
    }
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for beginners',
      features: [
        '5 Trading Signals per day',
        'Basic Market Analysis',
        'Email Notifications',
        'Community Support',
        'Basic Risk Management'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outlined',
      popular: false
    },
    {
      name: 'Premium',
      price: '$29',
      period: 'per month',
      description: 'Most popular choice',
      features: [
        'Unlimited Trading Signals',
        'Advanced AI Analysis',
        'Real-time Notifications',
        'MT5 Integration',
        'Advanced Risk Management',
        'Performance Analytics',
        'Priority Support'
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'contained',
      popular: true
    },
    {
      name: 'Professional',
      price: '$99',
      period: 'per month',
      description: 'For serious traders',
      features: [
        'Everything in Premium',
        'Custom AI Models',
        'API Access',
        'White-label Solutions',
        'Dedicated Account Manager',
        'Custom Integrations',
        '24/7 Phone Support'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outlined',
      popular: false
    }
  ];

  const stats = [
    { label: 'Active Traders', value: '10,000+' },
    { label: 'Signals Generated', value: '1M+' },
    { label: 'Success Rate', value: '78%' },
    { label: 'Countries', value: '50+' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                AI-Powered Trading Platform
              </Typography>
              <Typography
                variant="h5"
                component="p"
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Harness the power of artificial intelligence to make smarter trading decisions. 
                Get real-time signals, automated execution, and comprehensive analytics.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'grey.100'
                    },
                    px: 4,
                    py: 1.5
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    px: 4,
                    py: 1.5
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400
                }}
              >
                <TrendingUp sx={{ fontSize: 200, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box textAlign="center">
                <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Powerful Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        color: `${feature.color}.main`,
                        mb: 2
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Choose Your Plan
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {pricingPlans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.popular ? '2px solid' : '1px solid',
                  borderColor: plan.popular ? 'primary.main' : 'divider',
                  transform: plan.popular ? 'scale(1.05)' : 'none'
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h4" component="h3" gutterBottom textAlign="center">
                    {plan.name}
                  </Typography>
                  <Box textAlign="center" sx={{ mb: 2 }}>
                    <Typography variant="h3" component="div" color="primary">
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>
                  <List dense>
                    {plan.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant={plan.buttonVariant}
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/register')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="md" textAlign="center">
          <Typography variant="h3" component="h2" gutterBottom>
            Ready to Start Trading Smarter?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of traders who are already using AI to maximize their profits.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'grey.100'
              },
              px: 6,
              py: 2
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 4
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            © 2024 AI Trading Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;