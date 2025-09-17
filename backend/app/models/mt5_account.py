from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MT5Account(Base):
    __tablename__ = "mt5_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # MT5 Connection Details
    account_number = Column(String(50), nullable=False)
    server = Column(String(100), nullable=False)
    encrypted_password = Column(Text, nullable=False)  # Encrypted password
    
    # Account Info
    account_name = Column(String(100))
    broker = Column(String(100))
    currency = Column(String(10), default="USD")
    leverage = Column(Integer)
    
    # Account Status
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    last_connection = Column(DateTime(timezone=True))
    connection_error = Column(Text)
    
    # Account Balance (cached)
    balance = Column(Float, default=0.0)
    equity = Column(Float, default=0.0)
    margin = Column(Float, default=0.0)
    free_margin = Column(Float, default=0.0)
    
    # Trading Settings
    auto_trading_enabled = Column(Boolean, default=False)
    max_risk_per_trade = Column(Float, default=2.0)  # Percentage
    max_daily_trades = Column(Integer, default=10)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="mt5_accounts")
    trades = relationship("Trade", back_populates="mt5_account")

    def __repr__(self):
        return f"<MT5Account(id={self.id}, account={self.account_number}, server='{self.server}')>"