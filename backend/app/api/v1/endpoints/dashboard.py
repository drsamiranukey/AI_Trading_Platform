"""
Dashboard endpoints for real-time data and analytics
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.trade import Trade
from app.models.trading_signal import TradingSignal
from app.schemas.dashboard import (
    DashboardOverview, PerformanceMetrics, RecentActivity,
    MarketData, SignalAnalytics
)
from app.services.mt5_service import MT5Service
from app.services.ai_service import AIService

router = APIRouter()

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard overview with key metrics"""
    try:
        # Get account balance from MT5
        mt5_service = MT5Service()
        account_info = await mt5_service.get_account_info(current_user.id)
        
        # Get recent trades
        recent_trades = db.query(Trade).filter(
            Trade.user_id == current_user.id
        ).order_by(Trade.created_at.desc()).limit(5).all()
        
        # Get active signals
        active_signals = db.query(TradingSignal).filter(
            TradingSignal.status == "active"
        ).limit(5).all()
        
        # Calculate performance metrics
        today = datetime.utcnow().date()
        today_trades = db.query(Trade).filter(
            Trade.user_id == current_user.id,
            Trade.created_at >= today
        ).all()
        
        today_profit = sum([t.profit for t in today_trades if t.profit]) or 0
        
        return DashboardOverview(
            account_balance=account_info.get("balance", 0),
            equity=account_info.get("equity", 0),
            margin=account_info.get("margin", 0),
            free_margin=account_info.get("free_margin", 0),
            today_profit=today_profit,
            open_positions=len(account_info.get("positions", [])),
            active_signals=len(active_signals),
            recent_trades=[{
                "symbol": trade.symbol,
                "type": trade.trade_type,
                "profit": trade.profit,
                "created_at": trade.created_at
            } for trade in recent_trades]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard overview: {str(e)}"
        )

@router.get("/performance", response_model=PerformanceMetrics)
async def get_performance_metrics(
    period: str = "30d",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics for specified period"""
    try:
        # Calculate date range
        if period == "7d":
            start_date = datetime.utcnow() - timedelta(days=7)
        elif period == "30d":
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == "90d":
            start_date = datetime.utcnow() - timedelta(days=90)
        else:
            start_date = datetime.utcnow() - timedelta(days=30)
        
        # Get trades for the period
        trades = db.query(Trade).filter(
            Trade.user_id == current_user.id,
            Trade.created_at >= start_date
        ).all()
        
        if not trades:
            return PerformanceMetrics(
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0,
                total_profit=0,
                average_profit=0,
                best_trade=0,
                worst_trade=0,
                profit_factor=0,
                sharpe_ratio=0
            )
        
        # Calculate metrics
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t.profit and t.profit > 0])
        losing_trades = len([t for t in trades if t.profit and t.profit < 0])
        
        profits = [t.profit for t in trades if t.profit is not None]
        total_profit = sum(profits)
        average_profit = total_profit / total_trades if total_trades > 0 else 0
        
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        best_trade = max(profits) if profits else 0
        worst_trade = min(profits) if profits else 0
        
        # Calculate profit factor
        gross_profit = sum([p for p in profits if p > 0])
        gross_loss = abs(sum([p for p in profits if p < 0]))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Simple Sharpe ratio calculation
        if len(profits) > 1:
            import statistics
            sharpe_ratio = statistics.mean(profits) / statistics.stdev(profits) if statistics.stdev(profits) > 0 else 0
        else:
            sharpe_ratio = 0
        
        return PerformanceMetrics(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=round(win_rate, 2),
            total_profit=round(total_profit, 2),
            average_profit=round(average_profit, 2),
            best_trade=round(best_trade, 2),
            worst_trade=round(worst_trade, 2),
            profit_factor=round(profit_factor, 2),
            sharpe_ratio=round(sharpe_ratio, 2)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating performance metrics: {str(e)}"
        )

@router.get("/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent trading activity"""
    try:
        # Get recent trades
        trades = db.query(Trade).filter(
            Trade.user_id == current_user.id
        ).order_by(Trade.created_at.desc()).limit(limit).all()
        
        activities = []
        for trade in trades:
            activities.append(RecentActivity(
                type="trade",
                description=f"{trade.trade_type.upper()} {trade.symbol} - {trade.volume} lots",
                amount=trade.profit,
                timestamp=trade.created_at,
                status=trade.status
            ))
        
        return activities
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent activity: {str(e)}"
        )

@router.get("/market-data", response_model=List[MarketData])
async def get_market_data(
    symbols: List[str] = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
    current_user: User = Depends(get_current_user)
):
    """Get real-time market data for specified symbols"""
    try:
        mt5_service = MT5Service()
        market_data = []
        
        for symbol in symbols:
            tick_data = await mt5_service.get_symbol_info(symbol)
            if tick_data:
                market_data.append(MarketData(
                    symbol=symbol,
                    bid=tick_data.get("bid", 0),
                    ask=tick_data.get("ask", 0),
                    spread=tick_data.get("spread", 0),
                    change=tick_data.get("change", 0),
                    change_percent=tick_data.get("change_percent", 0)
                ))
        
        return market_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching market data: {str(e)}"
        )

@router.get("/signal-analytics", response_model=SignalAnalytics)
async def get_signal_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for trading signals"""
    try:
        # Get signals from last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        signals = db.query(TradingSignal).filter(
            TradingSignal.created_at >= start_date
        ).all()
        
        if not signals:
            return SignalAnalytics(
                total_signals=0,
                successful_signals=0,
                success_rate=0,
                average_accuracy=0,
                top_performing_pairs=[]
            )
        
        total_signals = len(signals)
        successful_signals = len([s for s in signals if s.status == "hit"])
        success_rate = (successful_signals / total_signals * 100) if total_signals > 0 else 0
        
        # Calculate average accuracy
        accuracies = [s.accuracy for s in signals if s.accuracy is not None]
        average_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0
        
        # Get top performing pairs
        pair_performance = {}
        for signal in signals:
            if signal.symbol not in pair_performance:
                pair_performance[signal.symbol] = {"total": 0, "successful": 0}
            pair_performance[signal.symbol]["total"] += 1
            if signal.status == "hit":
                pair_performance[signal.symbol]["successful"] += 1
        
        top_pairs = []
        for symbol, data in pair_performance.items():
            success_rate_pair = (data["successful"] / data["total"] * 100) if data["total"] > 0 else 0
            top_pairs.append({
                "symbol": symbol,
                "success_rate": round(success_rate_pair, 2),
                "total_signals": data["total"]
            })
        
        top_pairs = sorted(top_pairs, key=lambda x: x["success_rate"], reverse=True)[:5]
        
        return SignalAnalytics(
            total_signals=total_signals,
            successful_signals=successful_signals,
            success_rate=round(success_rate, 2),
            average_accuracy=round(average_accuracy, 2),
            top_performing_pairs=top_pairs
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating signal analytics: {str(e)}"
        )

@router.get("/chart-data/{symbol}")
async def get_chart_data(
    symbol: str,
    timeframe: str = "H1",
    bars: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get chart data for a specific symbol"""
    try:
        mt5_service = MT5Service()
        chart_data = await mt5_service.get_chart_data(symbol, timeframe, bars)
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "data": chart_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chart data: {str(e)}"
        )