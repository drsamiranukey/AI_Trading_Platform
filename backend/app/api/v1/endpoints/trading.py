"""
Trading endpoints for executing trades and managing positions
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.trade import Trade
from app.schemas.trading import (
    TradeCreate, TradeResponse, TradeUpdate, TradeHistory,
    PositionResponse, RiskManagementSettings
)
from app.services.trading_bot import TradingBot
from app.services.mt5_service import MT5Service

router = APIRouter()

@router.post("/execute", response_model=TradeResponse)
async def execute_trade(
    trade_data: TradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute a new trade"""
    try:
        # Check if user has active MT5 account
        if not current_user.mt5_accounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No MT5 account connected"
            )
        
        # Initialize trading bot
        trading_bot = TradingBot(current_user.id)
        
        # Execute trade
        trade_result = await trading_bot.execute_trade(trade_data.dict())
        
        if not trade_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=trade_result.get("error", "Trade execution failed")
            )
        
        # Save trade to database
        trade = Trade(
            user_id=current_user.id,
            symbol=trade_data.symbol,
            trade_type=trade_data.trade_type,
            volume=trade_data.volume,
            entry_price=trade_result["entry_price"],
            stop_loss=trade_data.stop_loss,
            take_profit=trade_data.take_profit,
            mt5_ticket=trade_result["ticket"],
            status="open"
        )
        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        
        return TradeResponse.from_orm(trade)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trade execution error: {str(e)}"
        )

@router.get("/positions", response_model=List[PositionResponse])
async def get_open_positions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all open positions"""
    try:
        mt5_service = MT5Service()
        positions = await mt5_service.get_positions(current_user.id)
        return positions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching positions: {str(e)}"
        )

@router.put("/positions/{position_id}/close")
async def close_position(
    position_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Close a specific position"""
    try:
        trading_bot = TradingBot(current_user.id)
        result = await trading_bot.close_position(position_id)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to close position")
            )
        
        # Update trade status in database
        from sqlalchemy import select
        trade_result = await db.execute(
            select(Trade).where(
                Trade.mt5_ticket == position_id,
                Trade.user_id == current_user.id
            )
        )
        trade = trade_result.scalar_one_or_none()
        
        if trade:
            trade.status = "closed"
            trade.exit_price = result["exit_price"]
            trade.profit = result["profit"]
            await db.commit()
        
        return {"message": "Position closed successfully", "profit": result["profit"]}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error closing position: {str(e)}"
        )

@router.get("/history", response_model=List[TradeHistory])
async def get_trade_history(
    limit: int = 100,
    offset: int = 0,
    symbol: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get trading history"""
    from sqlalchemy import select
    query = select(Trade).where(Trade.user_id == current_user.id)
    
    if symbol:
        query = query.where(Trade.symbol == symbol)
    
    query = query.order_by(Trade.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    trades = result.scalars().all()
    return [TradeHistory.from_orm(trade) for trade in trades]

@router.get("/statistics")
async def get_trading_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get trading statistics and performance metrics"""
    try:
        from sqlalchemy import select
        result = await db.execute(select(Trade).where(Trade.user_id == current_user.id))
        trades = result.scalars().all()
        
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t.profit and t.profit > 0])
        losing_trades = len([t for t in trades if t.profit and t.profit < 0])
        
        total_profit = sum([t.profit for t in trades if t.profit]) or 0
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        return {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": round(win_rate, 2),
            "total_profit": round(total_profit, 2),
            "average_profit": round(total_profit / total_trades, 2) if total_trades > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating statistics: {str(e)}"
        )

@router.post("/risk-management")
async def update_risk_settings(
    settings: RiskManagementSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update risk management settings"""
    try:
        # Update user's risk settings
        current_user.max_daily_loss = settings.max_daily_loss
        current_user.max_position_size = settings.max_position_size
        current_user.risk_per_trade = settings.risk_per_trade
        current_user.max_open_positions = settings.max_open_positions
        current_user.stop_loss_percentage = settings.stop_loss_percentage
        current_user.take_profit_percentage = settings.take_profit_percentage
        
        await db.commit()
        return {"message": "Risk settings updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating risk settings: {str(e)}"
        )

@router.get("/risk-management", response_model=RiskManagementSettings)
async def get_risk_settings(
    current_user: User = Depends(get_current_user)
):
    """Get current risk management settings"""
    return RiskManagementSettings(
        risk_per_trade=current_user.risk_per_trade or 2.0,
        max_daily_loss=current_user.max_daily_loss or 10.0,
        max_open_positions=current_user.max_open_positions or 5,
        stop_loss_percentage=current_user.stop_loss_percentage or 2.0,
        take_profit_percentage=current_user.take_profit_percentage or 4.0
    )