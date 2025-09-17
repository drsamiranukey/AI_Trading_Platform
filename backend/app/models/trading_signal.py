from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class SignalType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class SignalStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    EXECUTED = "executed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class TradingSignal(Base):
    __tablename__ = "trading_signals"

    id = Column(Integer, primary_key=True, index=True)
    
    # Signal Details
    symbol = Column(String(20), nullable=False, index=True)
    signal_type = Column(Enum(SignalType), nullable=False)
    status = Column(Enum(SignalStatus), default=SignalStatus.PENDING)
    
    # Price Levels
    entry_price = Column(Float, nullable=False)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    current_price = Column(Float)
    
    # AI Analysis
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    model_version = Column(String(50))
    analysis_data = Column(Text)  # JSON string with detailed analysis
    
    # Risk Management
    risk_reward_ratio = Column(Float)
    max_risk_percentage = Column(Float, default=2.0)
    position_size = Column(Float)
    
    # Timing
    signal_time = Column(DateTime(timezone=True), server_default=func.now())
    expiry_time = Column(DateTime(timezone=True))
    execution_time = Column(DateTime(timezone=True))
    
    # Performance Tracking
    is_successful = Column(Boolean)
    profit_loss = Column(Float, default=0.0)
    execution_price = Column(Float)
    
    # Metadata
    timeframe = Column(String(10))  # e.g., "1H", "4H", "1D"
    strategy_name = Column(String(100))
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trades = relationship("Trade", back_populates="signal")

    def __repr__(self):
        return f"<TradingSignal(id={self.id}, symbol='{self.symbol}', type='{self.signal_type}', confidence={self.confidence_score})>"