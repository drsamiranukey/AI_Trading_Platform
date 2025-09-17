"""
Pydantic schemas for dashboard endpoints
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class DashboardOverview(BaseModel):
    account_balance: float
    equity: float
    margin: float
    free_margin: float
    today_profit: float
    open_positions: int
    active_signals: int
    recent_trades: List[Dict[str, Any]]

class PerformanceMetrics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_profit: float
    average_profit: float
    best_trade: float
    worst_trade: float
    profit_factor: float
    sharpe_ratio: float

class RecentActivity(BaseModel):
    type: str  # trade, signal, payment, etc.
    description: str
    amount: Optional[float]
    timestamp: datetime
    status: str

class MarketData(BaseModel):
    symbol: str
    bid: float
    ask: float
    spread: float
    change: float
    change_percent: float

class SignalAnalytics(BaseModel):
    total_signals: int
    successful_signals: int
    success_rate: float
    average_accuracy: float
    top_performing_pairs: List[Dict[str, Any]]

class ChartData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

class TradingPair(BaseModel):
    symbol: str
    current_price: float
    change_24h: float
    change_percent_24h: float
    volume_24h: float
    high_24h: float
    low_24h: float

class AccountSummary(BaseModel):
    balance: float
    equity: float
    margin: float
    free_margin: float
    margin_level: float
    profit: float
    currency: str
    leverage: int
    server: str
    
class PositionSummary(BaseModel):
    symbol: str
    type: str
    volume: float
    profit: float
    swap: float
    open_price: float
    current_price: float
    
class SignalSummary(BaseModel):
    id: int
    symbol: str
    signal_type: str
    entry_price: float
    target_price: Optional[float]
    stop_loss: Optional[float]
    confidence: float
    status: str
    created_at: datetime
    
class NewsItem(BaseModel):
    title: str
    summary: str
    impact: str  # high, medium, low
    currency: str
    timestamp: datetime
    source: str
    
class EconomicEvent(BaseModel):
    title: str
    country: str
    currency: str
    impact: str
    forecast: Optional[str]
    previous: Optional[str]
    actual: Optional[str]
    timestamp: datetime
    
class RiskMetrics(BaseModel):
    current_drawdown: float
    max_drawdown: float
    risk_reward_ratio: float
    var_95: float  # Value at Risk 95%
    sharpe_ratio: float
    sortino_ratio: float
    
class PortfolioAllocation(BaseModel):
    symbol: str
    percentage: float
    value: float
    profit_loss: float
    
class TradingHours(BaseModel):
    market: str
    is_open: bool
    next_open: Optional[datetime]
    next_close: Optional[datetime]
    timezone: str