from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime


class MT5AccountBase(BaseModel):
    account_name: str = Field(..., min_length=1, max_length=100)
    account_number: str = Field(..., min_length=1, max_length=20)
    server: str = Field(..., min_length=1, max_length=100)
    is_demo: bool = False
    max_risk_per_trade: float = Field(default=2.0, ge=0.1, le=10.0)
    max_daily_loss: float = Field(default=5.0, ge=0.5, le=20.0)
    auto_trading_enabled: bool = False


class MT5AccountCreate(MT5AccountBase):
    password: str = Field(..., min_length=1)


class MT5AccountUpdate(BaseModel):
    account_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=1)
    server: Optional[str] = Field(None, min_length=1, max_length=100)
    max_risk_per_trade: Optional[float] = Field(None, ge=0.1, le=10.0)
    max_daily_loss: Optional[float] = Field(None, ge=0.5, le=20.0)
    auto_trading_enabled: Optional[bool] = None


class MT5AccountResponse(MT5AccountBase):
    id: int
    user_id: int
    is_connected: bool
    balance: Optional[float]
    equity: Optional[float]
    margin: Optional[float]
    free_margin: Optional[float]
    last_connection: Optional[datetime]
    connection_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MT5AccountInfo(BaseModel):
    balance: float
    equity: float
    margin: float
    free_margin: float
    leverage: int
    currency: str
    profit: float
    margin_level: float


class MT5PositionResponse(BaseModel):
    ticket: int
    symbol: str
    type: str
    volume: float
    price_open: float
    price_current: float
    profit: float
    swap: float
    time: int
    comment: str


class MT5TradeHistoryResponse(BaseModel):
    ticket: int
    order: int
    symbol: str
    type: str
    volume: float
    price: float
    profit: float
    swap: float
    commission: float
    time: int
    comment: str


class MT5SymbolInfo(BaseModel):
    symbol: str
    bid: float
    ask: float
    spread: int
    digits: int
    point: float
    volume_min: float
    volume_max: float
    volume_step: float


class MT5OrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    volume: float = Field(..., gt=0)
    order_type: str = Field(..., regex="^(buy|sell)$")
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = Field(None, max_length=100)

    @validator('volume')
    def validate_volume(cls, v):
        if v <= 0:
            raise ValueError('Volume must be greater than 0')
        return round(v, 2)


class MT5OrderResponse(BaseModel):
    ticket: int
    volume: float
    price: float
    bid: float
    ask: float
    comment: str
    request_id: int