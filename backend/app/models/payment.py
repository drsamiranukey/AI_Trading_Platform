from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentType(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    ONE_TIME = "one_time"
    REFUND = "refund"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Payment Details
    stripe_payment_intent_id = Column(String(100), unique=True, index=True)
    stripe_subscription_id = Column(String(100))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    
    # Payment Info
    payment_type = Column(Enum(PaymentType), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    description = Column(Text)
    
    # Subscription Details (if applicable)
    subscription_plan = Column(String(50))  # "monthly", "yearly"
    subscription_period_start = Column(DateTime(timezone=True))
    subscription_period_end = Column(DateTime(timezone=True))
    
    # Payment Method
    payment_method_type = Column(String(50))  # "card", "bank_transfer", etc.
    last_four_digits = Column(String(4))
    
    # Metadata
    invoice_url = Column(Text)
    receipt_url = Column(Text)
    failure_reason = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount}, status='{self.status}')>"


class BotConfiguration(Base):
    __tablename__ = "bot_configurations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Bot Settings
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=False)
    
    # Trading Parameters
    symbols = Column(Text)  # JSON array of symbols
    timeframes = Column(Text)  # JSON array of timeframes
    max_risk_per_trade = Column(Float, default=2.0)
    max_daily_trades = Column(Integer, default=10)
    max_concurrent_trades = Column(Integer, default=3)
    
    # AI Settings
    confidence_threshold = Column(Float, default=0.7)
    model_version = Column(String(50))
    strategy_type = Column(String(50))
    
    # Risk Management
    stop_loss_pips = Column(Integer)
    take_profit_pips = Column(Integer)
    trailing_stop = Column(Boolean, default=False)
    trailing_stop_pips = Column(Integer)
    
    # Schedule
    trading_hours_start = Column(String(10))  # "09:00"
    trading_hours_end = Column(String(10))    # "17:00"
    trading_days = Column(Text)  # JSON array of days
    
    # Advanced Settings
    news_filter = Column(Boolean, default=True)
    volatility_filter = Column(Boolean, default=True)
    custom_rules = Column(Text)  # JSON object
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bot_configs")

    def __repr__(self):
        return f"<BotConfiguration(id={self.id}, name='{self.name}', active={self.is_active})>"