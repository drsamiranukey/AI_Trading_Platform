"""
Admin endpoints for system management and monitoring
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.models.trade import Trade
from app.models.trading_signal import TradingSignal
from app.models.payment import Payment, Subscription
from app.schemas.admin import (
    UserManagement, SystemStats, UserActivity,
    AdminDashboard, SignalManagement, PaymentOverview
)

router = APIRouter()

@router.get("/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard overview"""
    try:
        # Get user statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        premium_users = db.query(User).filter(User.subscription_plan.in_(["professional", "enterprise"])).count()
        
        # Get trading statistics
        total_trades = db.query(Trade).count()
        today_trades = db.query(Trade).filter(
            Trade.created_at >= datetime.utcnow().date()
        ).count()
        
        # Get revenue statistics
        total_revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "completed"
        ).scalar() or 0
        
        monthly_revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "completed",
            Payment.created_at >= datetime.utcnow() - timedelta(days=30)
        ).scalar() or 0
        
        # Get signal statistics
        total_signals = db.query(TradingSignal).count()
        active_signals = db.query(TradingSignal).filter(
            TradingSignal.status == "active"
        ).count()
        
        return AdminDashboard(
            total_users=total_users,
            active_users=active_users,
            premium_users=premium_users,
            total_trades=total_trades,
            today_trades=today_trades,
            total_revenue=round(total_revenue, 2),
            monthly_revenue=round(monthly_revenue, 2),
            total_signals=total_signals,
            active_signals=active_signals
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin dashboard: {str(e)}"
        )

@router.get("/users", response_model=List[UserManagement])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users with management information"""
    try:
        query = db.query(User)
        
        if search:
            query = query.filter(
                User.email.contains(search) | 
                User.full_name.contains(search)
            )
        
        users = query.offset(skip).limit(limit).all()
        
        user_list = []
        for user in users:
            # Get user's trading stats
            total_trades = db.query(Trade).filter(Trade.user_id == user.id).count()
            total_profit = db.query(func.sum(Trade.profit)).filter(
                Trade.user_id == user.id
            ).scalar() or 0
            
            user_list.append(UserManagement(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                subscription_plan=user.subscription_plan,
                subscription_status=user.subscription_status,
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at,
                last_login=user.last_login,
                total_trades=total_trades,
                total_profit=round(total_profit, 2)
            ))
        
        return user_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user active status"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_active = is_active
        db.commit()
        
        return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user status: {str(e)}"
        )

@router.get("/users/{user_id}/activity", response_model=List[UserActivity])
async def get_user_activity(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed user activity"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get recent trades
        trades = db.query(Trade).filter(
            Trade.user_id == user_id
        ).order_by(Trade.created_at.desc()).limit(50).all()
        
        activities = []
        for trade in trades:
            activities.append(UserActivity(
                type="trade",
                description=f"{trade.trade_type.upper()} {trade.symbol} - {trade.volume} lots",
                amount=trade.profit,
                timestamp=trade.created_at,
                status=trade.status
            ))
        
        # Get payments
        payments = db.query(Payment).filter(
            Payment.user_id == user_id
        ).order_by(Payment.created_at.desc()).limit(20).all()
        
        for payment in payments:
            activities.append(UserActivity(
                type="payment",
                description=f"Payment of ${payment.amount}",
                amount=payment.amount,
                timestamp=payment.created_at,
                status=payment.status
            ))
        
        # Sort by timestamp
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        return activities[:50]  # Return latest 50 activities
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user activity: {str(e)}"
        )

@router.get("/signals", response_model=List[SignalManagement])
async def get_all_signals(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all trading signals for management"""
    try:
        query = db.query(TradingSignal)
        
        if status:
            query = query.filter(TradingSignal.status == status)
        
        signals = query.order_by(TradingSignal.created_at.desc()).offset(skip).limit(limit).all()
        
        return [SignalManagement.from_orm(signal) for signal in signals]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching signals: {str(e)}"
        )

@router.put("/signals/{signal_id}/status")
async def update_signal_status(
    signal_id: int,
    new_status: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update signal status"""
    try:
        signal = db.query(TradingSignal).filter(TradingSignal.id == signal_id).first()
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        
        signal.status = new_status
        db.commit()
        
        return {"message": "Signal status updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating signal status: {str(e)}"
        )

@router.get("/payments", response_model=List[PaymentOverview])
async def get_all_payments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all payments for overview"""
    try:
        query = db.query(Payment).join(User)
        
        if status:
            query = query.filter(Payment.status == status)
        
        payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
        
        payment_list = []
        for payment in payments:
            payment_list.append(PaymentOverview(
                id=payment.id,
                user_email=payment.user.email,
                amount=payment.amount,
                currency=payment.currency,
                status=payment.status,
                created_at=payment.created_at,
                stripe_payment_intent_id=payment.stripe_payment_intent_id
            ))
        
        return payment_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payments: {str(e)}"
        )

@router.get("/system-stats", response_model=SystemStats)
async def get_system_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get system statistics and health metrics"""
    try:
        # Database statistics
        total_users = db.query(User).count()
        total_trades = db.query(Trade).count()
        total_signals = db.query(TradingSignal).count()
        total_payments = db.query(Payment).count()
        
        # Recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_users_24h = db.query(User).filter(User.created_at >= yesterday).count()
        trades_24h = db.query(Trade).filter(Trade.created_at >= yesterday).count()
        signals_24h = db.query(TradingSignal).filter(TradingSignal.created_at >= yesterday).count()
        
        # Revenue statistics
        total_revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "completed"
        ).scalar() or 0
        
        return SystemStats(
            total_users=total_users,
            total_trades=total_trades,
            total_signals=total_signals,
            total_payments=total_payments,
            new_users_24h=new_users_24h,
            trades_24h=trades_24h,
            signals_24h=signals_24h,
            total_revenue=round(total_revenue, 2),
            system_uptime="99.9%",  # This would come from monitoring system
            database_size="2.5 GB"  # This would come from database metrics
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching system stats: {str(e)}"
        )