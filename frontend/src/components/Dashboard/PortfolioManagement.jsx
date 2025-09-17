import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Warning,
  Add,
  Edit,
  Delete,
  Assessment,
  Security,
  Timeline
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const PortfolioManagement = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 125000,
    dailyChange: 2350,
    dailyChangePercent: 1.92,
    positions: [],
    riskMetrics: {
      sharpeRatio: 1.45,
      maxDrawdown: -8.2,
      volatility: 12.5,
      beta: 0.85,
      var95: -2500
    },
    allocation: [],
    performance: []
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    quantity: 0,
    entryPrice: 0,
    positionType: 'long'
  });

  // Generate mock portfolio data
  useEffect(() => {
    const mockPositions = [
      {
        id: 1,
        symbol: 'EURUSD',
        quantity: 100000,
        entryPrice: 1.0850,
        currentPrice: 1.0892,
        unrealizedPnL: 420,
        unrealizedPnLPercent: 0.39,
        positionType: 'long',
        openDate: '2024-01-15',
        riskAmount: 1000
      },
      {
        id: 2,
        symbol: 'GBPUSD',
        quantity: 75000,
        entryPrice: 1.2650,
        currentPrice: 1.2598,
        unrealizedPnL: -390,
        unrealizedPnLPercent: -0.41,
        positionType: 'long',
        openDate: '2024-01-16',
        riskAmount: 800
      },
      {
        id: 3,
        symbol: 'USDJPY',
        quantity: 50000,
        entryPrice: 148.50,
        currentPrice: 149.25,
        unrealizedPnL: 252,
        unrealizedPnLPercent: 0.51,
        positionType: 'long',
        openDate: '2024-01-17',
        riskAmount: 600
      }
    ];

    const mockAllocation = [
      { name: 'Major Pairs', value: 65, color: '#8884d8' },
      { name: 'Minor Pairs', value: 25, color: '#82ca9d' },
      { name: 'Exotic Pairs', value: 10, color: '#ffc658' }
    ];

    const mockPerformance = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: 120000 + Math.random() * 10000 - 5000,
      drawdown: Math.random() * -5
    }));

    setPortfolioData(prev => ({
      ...prev,
      positions: mockPositions,
      allocation: mockAllocation,
      performance: mockPerformance
    }));
  }, []);

  const handleAddPosition = () => {
    if (newPosition.symbol && newPosition.quantity > 0) {
      const position = {
        id: Date.now(),
        ...newPosition,
        currentPrice: newPosition.entryPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        openDate: new Date().toISOString().split('T')[0],
        riskAmount: newPosition.quantity * 0.02 // 2% risk
      };

      setPortfolioData(prev => ({
        ...prev,
        positions: [...prev.positions, position]
      }));

      setNewPosition({
        symbol: '',
        quantity: 0,
        entryPrice: 0,
        positionType: 'long'
      });
      setOpenDialog(false);
    }
  };

  const calculateRiskMetrics = () => {
    const totalRisk = portfolioData.positions.reduce((sum, pos) => sum + pos.riskAmount, 0);
    const totalValue = portfolioData.totalValue;
    const riskPercentage = (totalRisk / totalValue) * 100;

    return {
      totalRisk,
      riskPercentage,
      positionCount: portfolioData.positions.length,
      largestPosition: Math.max(...portfolioData.positions.map(p => Math.abs(p.unrealizedPnL)))
    };
  };

  const riskMetrics = calculateRiskMetrics();

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="primary" />
        Portfolio Management
      </Typography>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4">
                ${portfolioData.totalValue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {portfolioData.dailyChange >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                <Typography 
                  color={portfolioData.dailyChange >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 1 }}
                >
                  ${Math.abs(portfolioData.dailyChange)} ({portfolioData.dailyChangePercent}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Risk Exposure
              </Typography>
              <Typography variant="h4" color="warning.main">
                ${riskMetrics.totalRisk.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {riskMetrics.riskPercentage.toFixed(2)}% of portfolio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sharpe Ratio
              </Typography>
              <Typography variant="h4" color="primary">
                {portfolioData.riskMetrics.sharpeRatio}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Risk-adjusted return
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Max Drawdown
              </Typography>
              <Typography variant="h4" color="error.main">
                {portfolioData.riskMetrics.maxDrawdown}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Largest peak-to-trough decline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Positions" icon={<Timeline />} />
            <Tab label="Risk Analysis" icon={<Security />} />
            <Tab label="Performance" icon={<Assessment />} />
            <Tab label="Allocation" icon={<PieChart />} />
          </Tabs>
        </Box>

        {/* Positions Tab */}
        <TabPanel value={selectedTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Current Positions</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Add Position
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Entry Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="right">P&L %</TableCell>
                  <TableCell align="right">Risk</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolioData.positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{position.symbol}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={position.positionType.toUpperCase()} 
                        color={position.positionType === 'long' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{position.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{position.entryPrice}</TableCell>
                    <TableCell align="right">{position.currentPrice}</TableCell>
                    <TableCell align="right">
                      <Typography color={position.unrealizedPnL >= 0 ? 'success.main' : 'error.main'}>
                        ${position.unrealizedPnL}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={position.unrealizedPnLPercent >= 0 ? 'success.main' : 'error.main'}>
                        {position.unrealizedPnLPercent}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">${position.riskAmount}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit Position">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Close Position">
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Risk Analysis Tab */}
        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Risk Metrics</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Value at Risk (95%)
                </Typography>
                <Typography variant="h6" color="error.main">
                  ${Math.abs(portfolioData.riskMetrics.var95).toLocaleString()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.abs(portfolioData.riskMetrics.var95) / portfolioData.totalValue * 100} 
                  color="error"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Portfolio Beta
                </Typography>
                <Typography variant="h6">
                  {portfolioData.riskMetrics.beta}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Correlation with market
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Volatility
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {portfolioData.riskMetrics.volatility}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Annualized standard deviation
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Risk Alerts</Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Portfolio concentration risk: 65% allocated to major pairs
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Current risk exposure is within acceptable limits
                </Typography>
              </Alert>
              <Alert severity="success">
                <Typography variant="body2">
                  Sharpe ratio indicates good risk-adjusted returns
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={portfolioData.performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabPanel>

        {/* Allocation Tab */}
        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>Portfolio Allocation</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolioData.allocation}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {portfolioData.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Allocation Details</Typography>
              {portfolioData.allocation.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      backgroundColor: item.color, 
                      mr: 1,
                      borderRadius: 1
                    }} 
                  />
                  <Typography variant="body2">
                    {item.name}: {item.value}%
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Add Position Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Position</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Symbol"
                value={newPosition.symbol}
                onChange={(e) => setNewPosition(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="e.g., EURUSD"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Position Type"
                value={newPosition.positionType}
                onChange={(e) => setNewPosition(prev => ({ ...prev, positionType: e.target.value }))}
              >
                <MenuItem value="long">Long</MenuItem>
                <MenuItem value="short">Short</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                fullWidth
                label="Quantity"
                value={newPosition.quantity}
                onChange={(e) => setNewPosition(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                type="number"
                fullWidth
                label="Entry Price"
                value={newPosition.entryPrice}
                onChange={(e) => setNewPosition(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) }))}
                inputProps={{ step: 0.0001 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPosition} variant="contained">Add Position</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioManagement;