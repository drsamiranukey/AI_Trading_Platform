from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class TradingSignalBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    signal_type: str = Field(..., regex="^(buy|sell|hold)$")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    entry_price: float = Field(..., gt=0)
    stop_loss: Optional[float] = Field(None, gt=0)
    take_profit: Optional[float] = Field(None, gt=0)
    timeframe: str = Field(default="H1")


class TradingSignalCreate(TradingSignalBase):
    risk_reward_ratio: Optional[float] = Field(None, gt=0)
    analysis_data: Optional[Dict[str, Any]] = None


class TradingSignalUpdate(BaseModel):
    signal_type: Optional[str] = Field(None, regex="^(buy|sell|hold)$")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    entry_price: Optional[float] = Field(None, gt=0)
    stop_loss: Optional[float] = Field(None, gt=0)
    take_profit: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, regex="^(active|executed|expired|cancelled)$")
    actual_entry_price: Optional[float] = Field(None, gt=0)
    actual_exit_price: Optional[float] = Field(None, gt=0)
    actual_profit: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=500)


class TradingSignalResponse(TradingSignalBase):
    id: int
    user_id: int
    risk_reward_ratio: Optional[float]
    status: str
    actual_entry_price: Optional[float]
    actual_exit_price: Optional[float]
    actual_profit: Optional[float]
    execution_time: Optional[datetime]
    expiry_time: Optional[datetime]
    analysis_data: Optional[Dict[str, Any]]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketAnalysisResponse(BaseModel):
    bullish_signals: int
    bearish_signals: int
    neutral_signals: int
    average_confidence: float
    overall_sentiment: str
    symbol_analysis: Dict[str, Dict[str, Any]]


class BacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    timeframe: str = Field(default="H1")
    days: int = Field(default=30, ge=1, le=365)


class BacktestResponse(BaseModel):
    initial_balance: float
    final_balance: float
    total_return_pct: float
    num_trades: int
    winning_trades: int
    win_rate_pct: float
    average_profit_per_trade: float
    trades: List[Dict[str, Any]]


class SignalPerformanceResponse(BaseModel):
    total_signals: int
    accuracy: float
    average_confidence: float
    profitable_signals: int
    loss_signals: int
    pending_signals: int


class BatchSignalRequest(BaseModel):
    symbols: List[str] = Field(..., min_items=1, max_items=20)
    timeframe: str = Field(default="H1")

    @validator('symbols')
    def validate_symbols(cls, v):
        if not v:
            raise ValueError('At least one symbol is required')
        return [symbol.upper() for symbol in v]


class SignalExecutionRequest(BaseModel):
    signal_id: int
    mt5_account_id: int
    volume: float = Field(..., gt=0)
    max_slippage: float = Field(default=2.0, ge=0, le=10)


class SignalExecutionResponse(BaseModel):
    signal_id: int
    trade_id: Optional[int]
    execution_status: str
    execution_price: Optional[float]
    message: str