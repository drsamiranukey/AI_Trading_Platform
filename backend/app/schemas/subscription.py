"""
Pydantic schemas for subscription and payment endpoints
"""
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: float
    features: List[str]
    stripe_price_id: Optional[str] = None
    
    @validator('price')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        return v

class PaymentCreate(BaseModel):
    plan_id: str
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    
    @validator('plan_id')
    def validate_plan_id(cls, v):
        valid_plans = ["basic", "professional", "enterprise"]
        if v not in valid_plans:
            raise ValueError(f'Plan ID must be one of: {valid_plans}')
        return v

class PaymentResponse(BaseModel):
    id: int
    amount: float
    currency: str
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    plan_id: str
    billing_cycle: BillingCycle = BillingCycle.MONTHLY

class SubscriptionUpdate(BaseModel):
    plan_id: str
    
    @validator('plan_id')
    def validate_plan_id(cls, v):
        valid_plans = ["basic", "professional", "enterprise"]
        if v not in valid_plans:
            raise ValueError(f'Plan ID must be one of: {valid_plans}')
        return v

class SubscriptionResponse(BaseModel):
    id: int
    plan_id: str
    billing_cycle: BillingCycle
    status: SubscriptionStatus
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    created_at: datetime
    stripe_subscription_id: Optional[str]
    
    class Config:
        from_attributes = True

class BillingHistory(BaseModel):
    id: int
    amount: float
    currency: str
    status: PaymentStatus
    description: Optional[str]
    invoice_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class UsageStats(BaseModel):
    signals_used: int
    signals_limit: int
    mt5_accounts_connected: int
    mt5_accounts_limit: int
    api_calls_used: int
    api_calls_limit: int

class SubscriptionFeatures(BaseModel):
    max_signals_per_day: int
    max_mt5_accounts: int
    priority_support: bool
    advanced_analytics: bool
    custom_strategies: bool
    api_access: bool
    white_label: bool

class PlanComparison(BaseModel):
    plan_id: str
    name: str
    price_monthly: float
    price_annual: float
    features: SubscriptionFeatures
    popular: bool = False
    
class SubscriptionDetails(BaseModel):
    subscription: SubscriptionResponse
    plan: SubscriptionPlan
    usage: UsageStats
    next_billing_date: Optional[datetime]
    amount_due: Optional[float]
    
class PaymentMethod(BaseModel):
    id: str
    type: str  # card, bank_account, etc.
    last4: Optional[str]
    brand: Optional[str]
    exp_month: Optional[int]
    exp_year: Optional[int]
    is_default: bool = False

class Invoice(BaseModel):
    id: str
    amount_paid: float
    amount_due: float
    currency: str
    status: str
    invoice_pdf: Optional[str]
    created_at: datetime
    period_start: datetime
    period_end: datetime
    
class SubscriptionPreview(BaseModel):
    plan_id: str
    billing_cycle: BillingCycle
    amount: float
    tax_amount: Optional[float] = 0
    total_amount: float
    proration_amount: Optional[float] = 0
    next_billing_date: datetime
    
class CouponCode(BaseModel):
    code: str
    discount_percent: Optional[float]
    discount_amount: Optional[float]
    valid_until: Optional[datetime]
    
class ApplyCoupon(BaseModel):
    coupon_code: str
    
    @validator('coupon_code')
    def validate_coupon_code(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Coupon code cannot be empty')
        return v.strip().upper()