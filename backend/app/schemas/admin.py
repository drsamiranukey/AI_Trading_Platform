"""
Pydantic schemas for admin endpoints
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AdminDashboard(BaseModel):
    total_users: int
    active_users: int
    premium_users: int
    total_trades: int
    today_trades: int
    total_revenue: float
    monthly_revenue: float
    total_signals: int
    active_signals: int

class UserManagement(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    subscription_plan: Optional[str]
    subscription_status: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    total_trades: int
    total_profit: float
    
    class Config:
        from_attributes = True

class UserActivity(BaseModel):
    type: str  # trade, payment, login, etc.
    description: str
    amount: Optional[float]
    timestamp: datetime
    status: str

class SignalManagement(BaseModel):
    id: int
    symbol: str
    signal_type: str
    entry_price: float
    target_price: Optional[float]
    stop_loss: Optional[float]
    confidence: float
    status: str
    accuracy: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentOverview(BaseModel):
    id: int
    user_email: str
    amount: float
    currency: str
    status: str
    created_at: datetime
    stripe_payment_intent_id: Optional[str]

class SystemStats(BaseModel):
    total_users: int
    total_trades: int
    total_signals: int
    total_payments: int
    new_users_24h: int
    trades_24h: int
    signals_24h: int
    total_revenue: float
    system_uptime: str
    database_size: str

class UserStatusUpdate(BaseModel):
    is_active: bool

class SignalStatusUpdate(BaseModel):
    status: str
    
class AdminNotification(BaseModel):
    id: int
    title: str
    message: str
    type: str  # info, warning, error, success
    is_read: bool
    created_at: datetime
    
class SystemHealth(BaseModel):
    database_status: str
    mt5_connection_status: str
    ai_service_status: str
    payment_service_status: str
    last_check: datetime
    
class UserSubscriptionOverview(BaseModel):
    user_id: int
    user_email: str
    plan_id: str
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    amount: float
    
class RevenueAnalytics(BaseModel):
    daily_revenue: List[dict]
    monthly_revenue: List[dict]
    revenue_by_plan: List[dict]
    churn_rate: float
    mrr: float  # Monthly Recurring Revenue
    arr: float  # Annual Recurring Revenue
    
class TradingAnalytics(BaseModel):
    total_volume: float
    total_profit: float
    average_trade_size: float
    most_traded_pairs: List[dict]
    trading_by_hour: List[dict]
    win_rate_by_pair: List[dict]
    
class UserEngagement(BaseModel):
    daily_active_users: int
    weekly_active_users: int
    monthly_active_users: int
    average_session_duration: float
    bounce_rate: float
    retention_rate: float