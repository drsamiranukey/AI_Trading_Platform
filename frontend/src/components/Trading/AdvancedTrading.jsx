import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Add,
  Delete,
  Edit,
  PlayArrow,
  Stop,
  Settings,
  Timeline,
  Assessment,
  Security,
  AutoMode,
  ManualMode
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AdvancedTrading = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [orderType, setOrderType] = useState('market');
  const [tradingMode, setTradingMode] = useState('manual');
  const [openStrategyDialog, setOpenStrategyDialog] = useState(false);
  
  const [orderForm, setOrderForm] = useState({
    symbol: 'EURUSD',
    orderType: 'market',
    side: 'buy',
    quantity: 10000,
    price: 0,
    stopLoss: 0,
    takeProfit: 0,
    timeInForce: 'GTC'
  });

  const [strategy, setStrategy] = useState({
    name: '',
    conditions: [],
    riskManagement: {
      maxRiskPerTrade: 2,
      maxDailyLoss: 5,
      positionSizing: 'fixed'
    },
    isActive: false
  });

  const [orders, setOrders] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [marketData, setMarketData] = useState({});

  // Mock market data
  useEffect(() => {
    const mockMarketData = {
      'EURUSD': { bid: 1.0890, ask: 1.0892, spread: 0.0002 },
      'GBPUSD': { bid: 1.2595, ask: 1.2598, spread: 0.0003 },
      'USDJPY': { bid: 149.22, ask: 149.25, spread: 0.03 },
      'AUDUSD': { bid: 0.6545, ask: 0.6548, spread: 0.0003 }
    };

    const mockOrders = [
      {
        id: 1,
        symbol: 'EURUSD',
        side: 'buy',
        quantity: 10000,
        orderType: 'limit',
        price: 1.0880,
        status: 'pending',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        symbol: 'GBPUSD',
        side: 'sell',
        quantity: 5000,
        orderType: 'market',
        price: 1.2598,
        status: 'filled',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const mockStrategies = [
      {
        id: 1,
        name: 'Moving Average Crossover',
        isActive: true,
        performance: { winRate: 65, totalTrades: 45, profit: 2350 }
      },
      {
        id: 2,
        name: 'RSI Divergence',
        isActive: false,
        performance: { winRate: 58, totalTrades: 32, profit: 1200 }
      }
    ];

    setMarketData(mockMarketData);
    setOrders(mockOrders);
    setStrategies(mockStrategies);
  }, []);

  const handlePlaceOrder = () => {
    const newOrder = {
      id: Date.now(),
      ...orderForm,
      status: orderForm.orderType === 'market' ? 'filled' : 'pending',
      timestamp: new Date().toISOString(),
      price: orderForm.orderType === 'market' ? 
        (orderForm.side === 'buy' ? marketData[orderForm.symbol]?.ask : marketData[orderForm.symbol]?.bid) :
        orderForm.price
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Reset form
    setOrderForm(prev => ({
      ...prev,
      quantity: 10000,
      price: 0,
      stopLoss: 0,
      takeProfit: 0
    }));
  };

  const handleCreateStrategy = () => {
    if (strategy.name) {
      const newStrategy = {
        id: Date.now(),
        ...strategy,
        performance: { winRate: 0, totalTrades: 0, profit: 0 }
      };
      
      setStrategies(prev => [...prev, newStrategy]);
      setStrategy({
        name: '',
        conditions: [],
        riskManagement: {
          maxRiskPerTrade: 2,
          maxDailyLoss: 5,
          positionSizing: 'fixed'
        },
        isActive: false
      });
      setOpenStrategyDialog(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'filled': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timeline color="primary" />
        Advanced Trading
      </Typography>

      {/* Trading Mode Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Trading Mode</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ManualMode />
                <Typography>Manual</Typography>
                <Switch
                  checked={tradingMode === 'auto'}
                  onChange={(e) => setTradingMode(e.target.checked ? 'auto' : 'manual')}
                />
                <Typography>Auto</Typography>
                <AutoMode />
              </Box>
            </Box>
          </Box>
          {tradingMode === 'auto' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Automated trading is enabled. Strategies will execute trades based on configured conditions.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Market Overview</Typography>
          <Grid container spacing={2}>
            {Object.entries(marketData).map(([symbol, data]) => (
              <Grid item xs={12} sm={6} md={3} key={symbol}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{symbol}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Bid</Typography>
                      <Typography variant="body2" color="error.main">{data.bid}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Ask</Typography>
                      <Typography variant="body2" color="success.main">{data.ask}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Spread</Typography>
                      <Typography variant="body2">{data.spread}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Main Trading Interface */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Order Entry" icon={<Add />} />
            <Tab label="Order Management" icon={<Assessment />} />
            <Tab label="Strategy Builder" icon={<Settings />} />
            <Tab label="Risk Management" icon={<Security />} />
          </Tabs>
        </Box>

        {/* Order Entry Tab */}
        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Place Order</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Symbol</InputLabel>
                    <Select
                      value={orderForm.symbol}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, symbol: e.target.value }))}
                    >
                      {Object.keys(marketData).map(symbol => (
                        <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Order Type</InputLabel>
                    <Select
                      value={orderForm.orderType}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, orderType: e.target.value }))}
                    >
                      <MenuItem value="market">Market</MenuItem>
                      <MenuItem value="limit">Limit</MenuItem>
                      <MenuItem value="stop">Stop</MenuItem>
                      <MenuItem value="stopLimit">Stop Limit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Side</InputLabel>
                    <Select
                      value={orderForm.side}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, side: e.target.value }))}
                    >
                      <MenuItem value="buy">Buy</MenuItem>
                      <MenuItem value="sell">Sell</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                  />
                </Grid>

                {orderForm.orderType !== 'market' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Price"
                      value={orderForm.price}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      inputProps={{ step: 0.0001 }}
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Stop Loss"
                    value={orderForm.stopLoss}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
                    inputProps={{ step: 0.0001 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Take Profit"
                    value={orderForm.takeProfit}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
                    inputProps={{ step: 0.0001 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handlePlaceOrder}
                    color={orderForm.side === 'buy' ? 'success' : 'error'}
                    startIcon={orderForm.side === 'buy' ? <TrendingUp /> : <TrendingDown />}
                  >
                    {orderForm.side === 'buy' ? 'Buy' : 'Sell'} {orderForm.symbol}
                  </Button>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Order Preview</Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography><strong>Symbol:</strong> {orderForm.symbol}</Typography>
                    <Typography><strong>Type:</strong> {orderForm.orderType}</Typography>
                    <Typography><strong>Side:</strong> {orderForm.side.toUpperCase()}</Typography>
                    <Typography><strong>Quantity:</strong> {orderForm.quantity.toLocaleString()}</Typography>
                    {orderForm.orderType !== 'market' && (
                      <Typography><strong>Price:</strong> {orderForm.price}</Typography>
                    )}
                    {orderForm.stopLoss > 0 && (
                      <Typography><strong>Stop Loss:</strong> {orderForm.stopLoss}</Typography>
                    )}
                    {orderForm.takeProfit > 0 && (
                      <Typography><strong>Take Profit:</strong> {orderForm.takeProfit}</Typography>
                    )}
                  </Box>
                  
                  {marketData[orderForm.symbol] && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Current Market Price
                      </Typography>
                      <Typography>
                        Bid: {marketData[orderForm.symbol].bid} | 
                        Ask: {marketData[orderForm.symbol].ask}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Order Management Tab */}
        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>Active Orders</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.side.toUpperCase()} 
                        color={order.side === 'buy' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{order.price}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status.toUpperCase()} 
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(order.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <>
                          <Tooltip title="Edit Order">
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Order">
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Strategy Builder Tab */}
        <TabPanel value={selectedTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Trading Strategies</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenStrategyDialog(true)}
            >
              Create Strategy
            </Button>
          </Box>

          <Grid container spacing={3}>
            {strategies.map((strat) => (
              <Grid item xs={12} md={6} key={strat.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{strat.name}</Typography>
                      <FormControlLabel
                        control={<Switch checked={strat.isActive} />}
                        label={strat.isActive ? 'Active' : 'Inactive'}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">Win Rate</Typography>
                        <Typography variant="h6" color="success.main">
                          {strat.performance.winRate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">Total Trades</Typography>
                        <Typography variant="h6">{strat.performance.totalTrades}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">Profit</Typography>
                        <Typography variant="h6" color="primary.main">
                          ${strat.performance.profit}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<Edit />}>Edit</Button>
                      <Button size="small" startIcon={<Assessment />}>Backtest</Button>
                      <Button size="small" color="error" startIcon={<Delete />}>Delete</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Risk Management Tab */}
        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>Risk Management Settings</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Position Sizing</Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Max Risk Per Trade (%)</Typography>
                    <Slider
                      value={strategy.riskManagement.maxRiskPerTrade}
                      onChange={(e, value) => setStrategy(prev => ({
                        ...prev,
                        riskManagement: { ...prev.riskManagement, maxRiskPerTrade: value }
                      }))}
                      min={0.5}
                      max={10}
                      step={0.5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Max Daily Loss (%)</Typography>
                    <Slider
                      value={strategy.riskManagement.maxDailyLoss}
                      onChange={(e, value) => setStrategy(prev => ({
                        ...prev,
                        riskManagement: { ...prev.riskManagement, maxDailyLoss: value }
                      }))}
                      min={1}
                      max={20}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>Position Sizing Method</InputLabel>
                    <Select
                      value={strategy.riskManagement.positionSizing}
                      onChange={(e) => setStrategy(prev => ({
                        ...prev,
                        riskManagement: { ...prev.riskManagement, positionSizing: e.target.value }
                      }))}
                    >
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                      <MenuItem value="percentage">Percentage of Account</MenuItem>
                      <MenuItem value="kelly">Kelly Criterion</MenuItem>
                      <MenuItem value="volatility">Volatility Based</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Risk Alerts</Typography>
                  
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Current risk exposure is within acceptable limits
                  </Alert>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Daily loss limit: 3.2% of 5% maximum
                  </Alert>
                  
                  <Alert severity="info">
                    Recommended: Enable stop-loss for all positions
                  </Alert>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>Risk Metrics</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Current Drawdown:</Typography>
                    <Typography variant="body2" color="error.main">-2.1%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Risk-Reward Ratio:</Typography>
                    <Typography variant="body2" color="success.main">1:2.3</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Open Risk:</Typography>
                    <Typography variant="body2">$2,400</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Strategy Creation Dialog */}
      <Dialog open={openStrategyDialog} onClose={() => setOpenStrategyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Trading Strategy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Strategy Name"
                value={strategy.name}
                onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Moving Average Crossover"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Entry Conditions</Typography>
              <Alert severity="info">
                Strategy builder with visual condition editor coming soon. 
                For now, strategies can be configured through the API.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStrategyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateStrategy} variant="contained">Create Strategy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedTrading;