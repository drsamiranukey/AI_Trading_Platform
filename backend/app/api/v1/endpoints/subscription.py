"""
Subscription and payment endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import stripe
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.payment import Payment, Subscription
from app.schemas.subscription import (
    SubscriptionPlan, SubscriptionResponse, PaymentCreate,
    PaymentResponse, BillingHistory, SubscriptionUpdate
)

router = APIRouter()

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

SUBSCRIPTION_PLANS = {
    "basic": {
        "name": "Basic Plan",
        "price": 29.99,
        "features": ["Basic signals", "Email support", "5 MT5 accounts"],
        "stripe_price_id": os.getenv("STRIPE_BASIC_PRICE_ID")
    },
    "professional": {
        "name": "Professional Plan", 
        "price": 79.99,
        "features": ["Advanced signals", "Priority support", "Unlimited MT5 accounts", "Risk management tools"],
        "stripe_price_id": os.getenv("STRIPE_PRO_PRICE_ID")
    },
    "enterprise": {
        "name": "Enterprise Plan",
        "price": 199.99,
        "features": ["Premium signals", "24/7 support", "Custom strategies", "API access", "White-label solution"],
        "stripe_price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID")
    }
}

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = []
    for plan_id, plan_data in SUBSCRIPTION_PLANS.items():
        plans.append(SubscriptionPlan(
            id=plan_id,
            name=plan_data["name"],
            price=plan_data["price"],
            features=plan_data["features"],
            stripe_price_id=plan_data["stripe_price_id"]
        ))
    return plans

@router.get("/current", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).first()
    
    if not subscription:
        return None
    
    return SubscriptionResponse.from_orm(subscription)

@router.post("/create-payment-intent")
async def create_payment_intent(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe payment intent for subscription"""
    try:
        plan = SUBSCRIPTION_PLANS.get(payment_data.plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subscription plan"
            )
        
        # Calculate amount (convert to cents for Stripe)
        amount = int(plan["price"] * 100)
        if payment_data.billing_cycle == "annual":
            amount = int(amount * 12 * 0.8)  # 20% discount for annual
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            customer=current_user.stripe_customer_id,
            metadata={
                "user_id": current_user.id,
                "plan_id": payment_data.plan_id,
                "billing_cycle": payment_data.billing_cycle
            }
        )
        
        # Save payment record
        payment = Payment(
            user_id=current_user.id,
            amount=amount / 100,
            currency="USD",
            stripe_payment_intent_id=intent.id,
            status="pending"
        )
        db.add(payment)
        db.commit()
        
        return {
            "client_secret": intent.client_secret,
            "payment_id": payment.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment creation error: {str(e)}"
        )

@router.post("/confirm-payment/{payment_id}")
async def confirm_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm payment and activate subscription"""
    try:
        payment = db.query(Payment).filter(
            Payment.id == payment_id,
            Payment.user_id == current_user.id
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)
        
        if intent.status == "succeeded":
            # Update payment status
            payment.status = "completed"
            
            # Create or update subscription
            plan_id = intent.metadata.get("plan_id")
            billing_cycle = intent.metadata.get("billing_cycle")
            
            # Deactivate existing subscription
            existing_sub = db.query(Subscription).filter(
                Subscription.user_id == current_user.id,
                Subscription.status == "active"
            ).first()
            
            if existing_sub:
                existing_sub.status = "cancelled"
            
            # Create new subscription
            subscription = Subscription(
                user_id=current_user.id,
                plan_id=plan_id,
                billing_cycle=billing_cycle,
                status="active",
                stripe_subscription_id=intent.id
            )
            db.add(subscription)
            
            # Update user subscription status
            current_user.subscription_plan = plan_id
            current_user.subscription_status = "active"
            
            db.commit()
            
            return {"message": "Subscription activated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment not completed"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment confirmation error: {str(e)}"
        )

@router.put("/update")
async def update_subscription(
    subscription_update: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update subscription plan"""
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        # Update subscription
        subscription.plan_id = subscription_update.plan_id
        current_user.subscription_plan = subscription_update.plan_id
        
        db.commit()
        
        return {"message": "Subscription updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription update error: {str(e)}"
        )

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        # Cancel subscription
        subscription.status = "cancelled"
        current_user.subscription_status = "cancelled"
        
        db.commit()
        
        return {"message": "Subscription cancelled successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription cancellation error: {str(e)}"
        )

@router.get("/billing-history", response_model=List[BillingHistory])
async def get_billing_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get billing history"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return [BillingHistory.from_orm(payment) for payment in payments]

@router.post("/webhook")
async def stripe_webhook(request: dict):
    """Handle Stripe webhooks"""
    try:
        # Handle different webhook events
        event_type = request.get("type")
        
        if event_type == "payment_intent.succeeded":
            # Handle successful payment
            pass
        elif event_type == "invoice.payment_failed":
            # Handle failed payment
            pass
        elif event_type == "customer.subscription.deleted":
            # Handle subscription cancellation
            pass
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}"
        )