import React, { useState, useEffect, useCallback } from 'react';
import { useTradingWebSocket } from '../hooks/useWebSocket';
import './RealTimeSignals.css';

const RealTimeSignals = () => {
  const [signals, setSignals] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection for real-time signals
  const { lastMessage, connectionStatus } = useTradingWebSocket('/ws/signals');

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'realtime_signal':
          setSignals(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 signals
          break;
          
        case 'active_signals':
          setSignals(data.data);
          break;
          
        case 'signal_statistics':
          setStatistics(data.data);
          break;
          
        case 'signal_update':
          setSignals(prev => prev.map(signal => 
            signal.id === data.data.signal_id 
              ? { ...signal, status: data.data.status, updated_at: data.data.timestamp }
              : signal
          ));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  // Effect to handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleMessage(lastMessage);
    }
  }, [lastMessage, handleMessage]);

  // Effect to track connection status
  useEffect(() => {
    setIsConnected(connectionStatus === 'Connected');
  }, [connectionStatus]);

  // Filter signals based on selected filter
  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true;
    if (filter === 'buy') return signal.signal_type === 'buy';
    if (filter === 'sell') return signal.signal_type === 'sell';
    if (filter === 'scalping') return signal.signal_style === 'scalping';
    if (filter === 'intraday') return signal.signal_style === 'intraday';
    if (filter === 'swing') return signal.signal_style === 'swing';
    if (filter === 'active') return signal.status === 'active';
    return true;
  });

  // Sort signals
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'confidence':
        return b.confidence_score - a.confidence_score;
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      default:
        return 0;
    }
  });

  // Get signal type icon
  const getSignalIcon = (type) => {
    return type === 'buy' ? '📈' : '📉';
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // Get signal style badge color
  const getStyleColor = (style) => {
    switch (style) {
      case 'scalping': return '#8b5cf6';
      case 'intraday': return '#06b6d4';
      case 'swing': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format price
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(5) : price;
  };

  return (
    <div className="realtime-signals">
      {/* Header */}
      <div className="signals-header">
        <div className="header-title">
          <h2>🚀 Live Trading Signals</h2>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>

        {/* Statistics */}
        {statistics.total_active_signals && (
          <div className="signal-stats">
            <div className="stat-item">
              <span className="stat-label">Active Signals</span>
              <span className="stat-value">{statistics.total_active_signals}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Buy Signals</span>
              <span className="stat-value buy">{statistics.signals_by_type?.buy || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sell Signals</span>
              <span className="stat-value sell">{statistics.signals_by_type?.sell || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Subscribers</span>
              <span className="stat-value">{statistics.subscribers_count || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="signals-filters">
        <div className="filter-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Signals</option>
            <option value="active">Active Only</option>
            <option value="buy">Buy Signals</option>
            <option value="sell">Sell Signals</option>
            <option value="scalping">Scalping</option>
            <option value="intraday">Intraday</option>
            <option value="swing">Swing</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="timestamp">Latest First</option>
            <option value="confidence">Confidence</option>
            <option value="symbol">Symbol</option>
          </select>
        </div>
      </div>

      {/* Signals List */}
      <div className="signals-list">
        {sortedSignals.length === 0 ? (
          <div className="no-signals">
            <div className="no-signals-icon">📊</div>
            <h3>No signals available</h3>
            <p>Waiting for live trading signals...</p>
          </div>
        ) : (
          sortedSignals.map((signal) => (
            <div key={signal.id} className={`signal-card ${signal.signal_type} ${signal.status}`}>
              {/* Signal Header */}
              <div className="signal-header">
                <div className="signal-main">
                  <span className="signal-icon">{getSignalIcon(signal.signal_type)}</span>
                  <div className="signal-info">
                    <h3 className="signal-symbol">{signal.symbol}</h3>
                    <span className="signal-type">{signal.signal_type.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="signal-meta">
                  <span 
                    className="signal-style-badge"
                    style={{ backgroundColor: getStyleColor(signal.signal_style) }}
                  >
                    {signal.signal_style}
                  </span>
                  <span className="signal-time">{formatTime(signal.timestamp)}</span>
                </div>
              </div>

              {/* Signal Details */}
              <div className="signal-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Entry Price</label>
                    <span className="price">{formatPrice(signal.entry_price)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Stop Loss</label>
                    <span className="price sl">{formatPrice(signal.stop_loss)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Take Profit</label>
                    <span className="price tp">{formatPrice(signal.take_profit)}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <label>Confidence</label>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${signal.confidence_score * 100}%`,
                          backgroundColor: getConfidenceColor(signal.confidence_score)
                        }}
                      ></div>
                      <span className="confidence-text">
                        {(signal.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>R:R Ratio</label>
                    <span className="ratio">1:{signal.risk_reward_ratio?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>

                {/* Market Context */}
                {signal.market_context && (
                  <div className="market-context">
                    <div className="context-item">
                      <span className="context-label">Session:</span>
                      <span className="context-value">{signal.market_context.session}</span>
                    </div>
                    <div className="context-item">
                      <span className="context-label">Volatility:</span>
                      <span className="context-value">{signal.market_context.volatility_level}</span>
                    </div>
                    {signal.expected_duration && (
                      <div className="context-item">
                        <span className="context-label">Duration:</span>
                        <span className="context-value">{signal.expected_duration}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Risk Assessment */}
                {signal.risk_assessment && (
                  <div className="risk-assessment">
                    <div className="risk-item">
                      <span className="risk-label">Risk Level:</span>
                      <span className={`risk-value ${signal.risk_assessment.risk_level}`}>
                        {signal.risk_assessment.risk_level}
                      </span>
                    </div>
                    <div className="risk-item">
                      <span className="risk-label">Win Probability:</span>
                      <span className="risk-value">{signal.risk_assessment.win_probability}</span>
                    </div>
                  </div>
                )}

                {/* Signal Status */}
                <div className="signal-status">
                  <span className={`status-badge ${signal.status}`}>
                    {signal.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {signal.updated_at && signal.updated_at !== signal.timestamp && (
                    <span className="updated-time">
                      Updated: {formatTime(signal.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="signals-footer">
        <p>
          🔄 Signals update automatically • 
          📊 {sortedSignals.length} signals displayed • 
          ⚡ Real-time AI analysis
        </p>
      </div>
    </div>
  );
};

export default RealTimeSignals;