"""
Pydantic schemas for trading endpoints
"""
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TradeType(str, Enum):
    BUY = "buy"
    SELL = "sell"

class TradeStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class TradeCreate(BaseModel):
    symbol: str
    trade_type: TradeType
    volume: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = None
    
    @validator('volume')
    def validate_volume(cls, v):
        if v <= 0:
            raise ValueError('Volume must be positive')
        if v > 100:  # Max 100 lots
            raise ValueError('Volume cannot exceed 100 lots')
        return v
    
    @validator('symbol')
    def validate_symbol(cls, v):
        if len(v) < 6:
            raise ValueError('Invalid symbol format')
        return v.upper()

class TradeUpdate(BaseModel):
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = None

class TradeResponse(BaseModel):
    id: int
    symbol: str
    trade_type: TradeType
    volume: float
    entry_price: Optional[float]
    exit_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    profit: Optional[float]
    status: TradeStatus
    mt5_ticket: Optional[int]
    comment: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TradeHistory(BaseModel):
    id: int
    symbol: str
    trade_type: TradeType
    volume: float
    entry_price: Optional[float]
    exit_price: Optional[float]
    profit: Optional[float]
    status: TradeStatus
    created_at: datetime
    closed_at: Optional[datetime]
    duration_minutes: Optional[int]
    
    class Config:
        from_attributes = True

class PositionResponse(BaseModel):
    ticket: int
    symbol: str
    type: str
    volume: float
    price_open: float
    price_current: float
    profit: float
    swap: float
    comment: str
    time: datetime

class RiskManagementSettings(BaseModel):
    risk_per_trade: float = 2.0  # Percentage of account
    max_daily_loss: float = 10.0  # Percentage of account
    max_position_size: float = 1.0  # Added missing field
    max_open_positions: int = 5
    stop_loss_percentage: float = 2.0
    take_profit_percentage: float = 4.0
    
    @validator('risk_per_trade')
    def validate_risk_per_trade(cls, v):
        if v <= 0 or v > 10:
            raise ValueError('Risk per trade must be between 0 and 10%')
        return v
    
    @validator('max_daily_loss')
    def validate_max_daily_loss(cls, v):
        if v <= 0 or v > 50:
            raise ValueError('Max daily loss must be between 0 and 50%')
        return v
    
    @validator('max_open_positions')
    def validate_max_positions(cls, v):
        if v <= 0 or v > 20:
            raise ValueError('Max open positions must be between 1 and 20')
        return v

class TradingStatistics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_profit: float
    average_profit: float
    best_trade: float
    worst_trade: float
    profit_factor: float
    max_drawdown: float
    sharpe_ratio: float
    
class AccountInfo(BaseModel):
    balance: float
    equity: float
    margin: float
    free_margin: float
    margin_level: float
    profit: float
    currency: str
    leverage: int
    
class MarketOrder(BaseModel):
    symbol: str
    order_type: TradeType
    volume: float
    price: Optional[float] = None  # For market orders, price is optional
    deviation: int = 10  # Price deviation in points
    
class PendingOrder(BaseModel):
    symbol: str
    order_type: str  # BUY_LIMIT, SELL_LIMIT, BUY_STOP, SELL_STOP
    volume: float
    price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    expiration: Optional[datetime] = None
    comment: Optional[str] = None