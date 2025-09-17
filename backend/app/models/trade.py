from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class TradeType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class TradeStatus(str, enum.Enum):
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mt5_account_id = Column(Integer, ForeignKey("mt5_accounts.id"), nullable=False)
    signal_id = Column(Integer, ForeignKey("trading_signals.id"))
    
    # MT5 Trade Details
    mt5_ticket = Column(String(50), unique=True, index=True)  # MT5 order ticket
    symbol = Column(String(20), nullable=False, index=True)
    trade_type = Column(Enum(TradeType), nullable=False)
    status = Column(Enum(TradeStatus), default=TradeStatus.PENDING)
    
    # Position Details
    volume = Column(Float, nullable=False)  # Lot size
    entry_price = Column(Float)  # Changed from open_price for consistency
    exit_price = Column(Float)   # Changed from close_price for consistency
    current_price = Column(Float)
    
    # Risk Management
    stop_loss = Column(Float)
    take_profit = Column(Float)
    
    # Financial Details
    profit = Column(Float, default=0.0)  # Changed from profit_loss for consistency
    commission = Column(Float, default=0.0)
    swap = Column(Float, default=0.0)
    net_profit = Column(Float, default=0.0)
    
    # Timing
    open_time = Column(DateTime(timezone=True))
    close_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)
    
    # Execution Details
    execution_type = Column(String(20))  # "manual", "auto", "signal"
    slippage = Column(Float, default=0.0)
    
    # Analysis
    entry_reason = Column(Text)
    exit_reason = Column(Text)
    notes = Column(Text)
    
    # Performance Metrics
    max_profit = Column(Float, default=0.0)
    max_loss = Column(Float, default=0.0)
    risk_reward_achieved = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="trades")
    mt5_account = relationship("MT5Account", back_populates="trades")
    signal = relationship("TradingSignal", back_populates="trades")

    def __repr__(self):
        return f"<Trade(id={self.id}, symbol='{self.symbol}', type='{self.trade_type}', status='{self.status}')>"