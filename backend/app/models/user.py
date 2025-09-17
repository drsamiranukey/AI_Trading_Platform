from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PREMIUM = "premium"
    FREE = "free"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    
    # User status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(Enum(UserRole), default=UserRole.FREE)
    
    # Subscription
    subscription_plan = Column(String(50))  # basic, professional, enterprise
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INACTIVE)
    subscription_expires_at = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String(100))
    
    # Risk Management Settings
    risk_per_trade = Column(Float, default=2.0)
    max_daily_loss = Column(Float, default=10.0)
    max_position_size = Column(Float, default=1.0)  # Added missing field
    max_open_positions = Column(Integer, default=5)
    stop_loss_percentage = Column(Float, default=2.0)
    take_profit_percentage = Column(Float, default=4.0)
    
    # Profile
    phone = Column(String(20))
    country = Column(String(50))
    timezone = Column(String(50), default="UTC")
    avatar_url = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    mt5_accounts = relationship("MT5Account", back_populates="user", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="user")
    bot_configs = relationship("BotConfiguration", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"