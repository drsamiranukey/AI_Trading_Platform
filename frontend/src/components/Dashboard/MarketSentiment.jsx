import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Sentiment,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  NewReleases,
  Schedule,
  Assessment
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

const MarketSentiment = ({ sentiment = null }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Mock data if no sentiment provided
  const defaultSentiment = {
    overall_sentiment: 'neutral',
    sentiment_score: 0.5,
    bullish_signals: 12,
    bearish_signals: 8,
    neutral_signals: 5,
    market_fear_greed: 45,
    volatility_index: 22.5,
    trend_strength: 0.65,
    news_sentiment: {
      positive: 15,
      negative: 8,
      neutral: 12
    },
    sector_sentiment: [
      { sector: 'Technology', sentiment: 'bullish', score: 0.75 },
      { sector: 'Finance', sentiment: 'neutral', score: 0.45 },
      { sector: 'Healthcare', sentiment: 'bullish', score: 0.68 },
      { sector: 'Energy', sentiment: 'bearish', score: 0.25 },
      { sector: 'Consumer', sentiment: 'neutral', score: 0.52 }
    ],
    key_indicators: [
      { name: 'RSI', value: 58.2, signal: 'neutral' },
      { name: 'MACD', value: 0.15, signal: 'bullish' },
      { name: 'Moving Average', value: 1.05, signal: 'bullish' },
      { name: 'Bollinger Bands', value: 0.8, signal: 'neutral' }
    ],
    recent_news: [
      {
        title: 'Federal Reserve maintains interest rates',
        sentiment: 'neutral',
        impact: 'medium',
        timestamp: new Date().toISOString()
      },
      {
        title: 'Tech stocks rally on earnings beat',
        sentiment: 'positive',
        impact: 'high',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: 'Oil prices decline amid supply concerns',
        sentiment: 'negative',
        impact: 'medium',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    last_updated: new Date().toISOString()
  };

  const currentSentiment = sentiment || defaultSentiment;

  const getSentimentColor = (sentimentValue) => {
    if (typeof sentimentValue === 'string') {
      switch (sentimentValue.toLowerCase()) {
        case 'bullish':
        case 'positive':
          return 'success';
        case 'bearish':
        case 'negative':
          return 'error';
        case 'neutral':
        default:
          return 'default';
      }
    }
    
    // Numeric sentiment (0-1)
    if (sentimentValue >= 0.7) return 'success';
    if (sentimentValue <= 0.3) return 'error';
    return 'default';
  };

  const getSentimentIcon = (sentimentValue) => {
    if (typeof sentimentValue === 'string') {
      switch (sentimentValue.toLowerCase()) {
        case 'bullish':
        case 'positive':
          return <TrendingUp />;
        case 'bearish':
        case 'negative':
          return <TrendingDown />;
        case 'neutral':
        default:
          return <TrendingFlat />;
      }
    }
    
    // Numeric sentiment (0-1)
    if (sentimentValue >= 0.7) return <SentimentVerySatisfied />;
    if (sentimentValue >= 0.6) return <SentimentSatisfied />;
    if (sentimentValue >= 0.4) return <SentimentNeutral />;
    if (sentimentValue >= 0.3) return <SentimentDissatisfied />;
    return <SentimentVeryDissatisfied />;
  };

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Chart data for signal distribution
  const signalDistributionData = {
    labels: ['Bullish', 'Bearish', 'Neutral'],
    datasets: [
      {
        data: [
          currentSentiment.bullish_signals,
          currentSentiment.bearish_signals,
          currentSentiment.neutral_signals
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(158, 158, 158, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(158, 158, 158, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart data for sector sentiment
  const sectorSentimentData = {
    labels: currentSentiment.sector_sentiment?.map(s => s.sector) || [],
    datasets: [
      {
        label: 'Sentiment Score',
        data: currentSentiment.sector_sentiment?.map(s => s.score * 100) || [],
        backgroundColor: currentSentiment.sector_sentiment?.map(s => 
          s.score >= 0.6 ? 'rgba(76, 175, 80, 0.8)' :
          s.score <= 0.4 ? 'rgba(244, 67, 54, 0.8)' :
          'rgba(158, 158, 158, 0.8)'
        ) || [],
        borderColor: currentSentiment.sector_sentiment?.map(s => 
          s.score >= 0.6 ? 'rgba(76, 175, 80, 1)' :
          s.score <= 0.4 ? 'rgba(244, 67, 54, 1)' :
          'rgba(158, 158, 158, 1)'
        ) || [],
        borderWidth: 1
      }
    ]
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Overall Sentiment Header */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Overall Sentiment</Typography>
                {getSentimentIcon(currentSentiment.overall_sentiment)}
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" component="div" gutterBottom>
                  <Chip
                    label={currentSentiment.overall_sentiment?.toUpperCase()}
                    color={getSentimentColor(currentSentiment.overall_sentiment)}
                    size="large"
                  />
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Score: {(currentSentiment.sentiment_score * 100).toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fear & Greed Index
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Market Fear & Greed
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {currentSentiment.market_fear_greed}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={currentSentiment.market_fear_greed}
                  color={
                    currentSentiment.market_fear_greed >= 70 ? 'success' :
                    currentSentiment.market_fear_greed <= 30 ? 'error' : 'warning'
                  }
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                {currentSentiment.market_fear_greed >= 70 ? 'Extreme Greed' :
                 currentSentiment.market_fear_greed >= 55 ? 'Greed' :
                 currentSentiment.market_fear_greed >= 45 ? 'Neutral' :
                 currentSentiment.market_fear_greed >= 25 ? 'Fear' : 'Extreme Fear'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Metrics
              </Typography>
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    Volatility Index
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {currentSentiment.volatility_index}%
                  </Typography>
                </Box>
              </Box>
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    Trend Strength
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(currentSentiment.trend_strength * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Last Updated: {format(new Date(currentSentiment.last_updated), 'MMM dd, HH:mm')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analysis Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Signal Analysis" />
            <Tab label="Sector Sentiment" />
            <Tab label="Technical Indicators" />
            <Tab label="News Impact" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Signal Distribution
                </Typography>
                <Box height={300}>
                  <Doughnut
                    data={signalDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Signal Summary
                </Typography>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp color="success" />
                      <Typography variant="body1">Bullish Signals</Typography>
                    </Box>
                    <Typography variant="h6" color="success.main">
                      {currentSentiment.bullish_signals}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingDown color="error" />
                      <Typography variant="body1">Bearish Signals</Typography>
                    </Box>
                    <Typography variant="h6" color="error.main">
                      {currentSentiment.bearish_signals}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingFlat color="action" />
                      <Typography variant="body1">Neutral Signals</Typography>
                    </Box>
                    <Typography variant="h6">
                      {currentSentiment.neutral_signals}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Sector Sentiment Analysis
                </Typography>
                <Box height={300}>
                  <Bar
                    data={sectorSentimentData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Sentiment Score (%)'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Sector Details
                </Typography>
                <List>
                  {currentSentiment.sector_sentiment?.map((sector, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getSentimentIcon(sector.sentiment)}
                      </ListItemIcon>
                      <ListItemText
                        primary={sector.sector}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={sector.sentiment.toUpperCase()}
                              color={getSentimentColor(sector.sentiment)}
                              size="small"
                            />
                            <Typography variant="body2">
                              {(sector.score * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Key Technical Indicators
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Indicator</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Signal</TableCell>
                      <TableCell>Interpretation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentSentiment.key_indicators?.map((indicator, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {indicator.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {indicator.value}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={indicator.signal.toUpperCase()}
                            color={getSentimentColor(indicator.signal)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {indicator.signal === 'bullish' ? 'Positive momentum' :
                             indicator.signal === 'bearish' ? 'Negative momentum' :
                             'Sideways movement'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Market News Impact
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {currentSentiment.news_sentiment?.positive || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Positive News
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {currentSentiment.news_sentiment?.negative || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Negative News
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent textAlign="center">
                      <Typography variant="h4">
                        {currentSentiment.news_sentiment?.neutral || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Neutral News
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <List>
                {currentSentiment.recent_news?.map((news, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <NewReleases color={getSentimentColor(news.sentiment)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={news.title}
                      secondary={
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Chip
                            label={news.sentiment.toUpperCase()}
                            color={getSentimentColor(news.sentiment)}
                            size="small"
                          />
                          <Chip
                            label={`${news.impact.toUpperCase()} IMPACT`}
                            color={getImpactColor(news.impact)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="body2" color="textSecondary">
                            {format(new Date(news.timestamp), 'MMM dd, HH:mm')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MarketSentiment;