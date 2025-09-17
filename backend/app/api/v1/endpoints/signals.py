from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.trading_signal import TradingSignal
from app.models.mt5_account import MT5Account
from app.schemas.signals import (
    TradingSignalCreate, TradingSignalResponse, TradingSignalUpdate,
    MarketAnalysisResponse, BacktestRequest, BacktestResponse
)
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=TradingSignalResponse)
async def generate_signal(
    symbol: str,
    timeframe: str = "H1",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new trading signal for a symbol."""
    try:
        # Generate signal using AI service
        signal_data = await ai_service.generate_signal(symbol, timeframe)
        
        if not signal_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No signal generated for the given symbol"
            )
        
        # Create signal record
        trading_signal = TradingSignal(
            user_id=current_user.id,
            symbol=signal_data['symbol'],
            signal_type=signal_data['signal_type'],
            confidence_score=signal_data['confidence_score'],
            entry_price=signal_data['entry_price'],
            stop_loss=signal_data['stop_loss'],
            take_profit=signal_data['take_profit'],
            risk_reward_ratio=signal_data['risk_reward_ratio'],
            timeframe=signal_data['timeframe'],
            analysis_data=signal_data['analysis_data'],
            status="active"
        )
        
        db.add(trading_signal)
        await db.commit()
        await db.refresh(trading_signal)
        
        return TradingSignalResponse.from_orm(trading_signal)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating signal: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate trading signal"
        )


@router.get("/", response_model=List[TradingSignalResponse])
async def get_signals(
    skip: int = 0,
    limit: int = 50,
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get trading signals for the current user."""
    try:
        query = select(TradingSignal).where(TradingSignal.user_id == current_user.id)
        
        if symbol:
            query = query.where(TradingSignal.symbol == symbol)
        
        if status:
            query = query.where(TradingSignal.status == status)
        
        query = query.order_by(desc(TradingSignal.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        signals = result.scalars().all()
        
        return [TradingSignalResponse.from_orm(signal) for signal in signals]
        
    except Exception as e:
        logger.error(f"Error getting signals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trading signals"
        )


@router.get("/{signal_id}", response_model=TradingSignalResponse)
async def get_signal(
    signal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific trading signal."""
    try:
        result = await db.execute(
            select(TradingSignal).where(
                TradingSignal.id == signal_id,
                TradingSignal.user_id == current_user.id
            )
        )
        signal = result.scalar_one_or_none()
        
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trading signal not found"
            )
        
        return TradingSignalResponse.from_orm(signal)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting signal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trading signal"
        )


@router.put("/{signal_id}", response_model=TradingSignalResponse)
async def update_signal(
    signal_id: int,
    signal_data: TradingSignalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a trading signal."""
    try:
        result = await db.execute(
            select(TradingSignal).where(
                TradingSignal.id == signal_id,
                TradingSignal.user_id == current_user.id
            )
        )
        signal = result.scalar_one_or_none()
        
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trading signal not found"
            )
        
        # Update fields
        update_data = signal_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(signal, field, value)
        
        await db.commit()
        await db.refresh(signal)
        
        return TradingSignalResponse.from_orm(signal)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating signal: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update trading signal"
        )


@router.delete("/{signal_id}")
async def delete_signal(
    signal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a trading signal."""
    try:
        result = await db.execute(
            select(TradingSignal).where(
                TradingSignal.id == signal_id,
                TradingSignal.user_id == current_user.id
            )
        )
        signal = result.scalar_one_or_none()
        
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trading signal not found"
            )
        
        await db.delete(signal)
        await db.commit()
        
        return {"message": "Trading signal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting signal: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trading signal"
        )


@router.post("/batch-generate")
async def batch_generate_signals(
    symbols: List[str],
    timeframe: str = "H1",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate signals for multiple symbols in the background."""
    try:
        async def generate_batch_signals():
            for symbol in symbols:
                try:
                    signal_data = await ai_service.generate_signal(symbol, timeframe)
                    
                    if signal_data:
                        trading_signal = TradingSignal(
                            user_id=current_user.id,
                            symbol=signal_data['symbol'],
                            signal_type=signal_data['signal_type'],
                            confidence_score=signal_data['confidence_score'],
                            entry_price=signal_data['entry_price'],
                            stop_loss=signal_data['stop_loss'],
                            take_profit=signal_data['take_profit'],
                            risk_reward_ratio=signal_data['risk_reward_ratio'],
                            timeframe=signal_data['timeframe'],
                            analysis_data=signal_data['analysis_data'],
                            status="active"
                        )
                        
                        db.add(trading_signal)
                        await db.commit()
                        
                except Exception as e:
                    logger.error(f"Error generating signal for {symbol}: {str(e)}")
                    continue
        
        background_tasks.add_task(generate_batch_signals)
        
        return {
            "message": f"Batch signal generation started for {len(symbols)} symbols",
            "symbols": symbols
        }
        
    except Exception as e:
        logger.error(f"Error starting batch signal generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start batch signal generation"
        )


@router.get("/analysis/market-sentiment", response_model=MarketAnalysisResponse)
async def get_market_sentiment(
    symbols: List[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get market sentiment analysis."""
    try:
        # Default symbols if none provided
        if not symbols:
            symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"]
        
        sentiment_data = await ai_service.analyze_market_sentiment(symbols)
        
        return MarketAnalysisResponse(**sentiment_data)
        
    except Exception as e:
        logger.error(f"Error getting market sentiment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze market sentiment"
        )


@router.post("/backtest", response_model=BacktestResponse)
async def backtest_strategy(
    backtest_request: BacktestRequest,
    current_user: User = Depends(get_current_user)
):
    """Backtest the trading strategy."""
    try:
        backtest_results = await ai_service.backtest_strategy(
            symbol=backtest_request.symbol,
            timeframe=backtest_request.timeframe,
            days=backtest_request.days
        )
        
        if not backtest_results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to run backtest"
            )
        
        return BacktestResponse(**backtest_results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running backtest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run backtest"
        )


@router.post("/train-model")
async def train_ai_model(
    symbol: str,
    timeframe: str = "H1",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Train the AI model for a specific symbol."""
    try:
        async def train_model_task():
            try:
                success = await ai_service.train_model(symbol, timeframe)
                logger.info(f"Model training for {symbol} completed: {success}")
            except Exception as e:
                logger.error(f"Error training model for {symbol}: {str(e)}")
        
        background_tasks.add_task(train_model_task)
        
        return {
            "message": f"Model training started for {symbol}",
            "symbol": symbol,
            "timeframe": timeframe
        }
        
    except Exception as e:
        logger.error(f"Error starting model training: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start model training"
        )


@router.get("/performance/stats")
async def get_signal_performance(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signal performance statistics."""
    try:
        # Get signals from the last N days
        from_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(TradingSignal).where(
                TradingSignal.user_id == current_user.id,
                TradingSignal.created_at >= from_date
            )
        )
        signals = result.scalars().all()
        
        if not signals:
            return {
                "total_signals": 0,
                "accuracy": 0.0,
                "average_confidence": 0.0,
                "profitable_signals": 0,
                "loss_signals": 0
            }
        
        # Calculate statistics
        total_signals = len(signals)
        profitable_signals = len([s for s in signals if s.actual_profit and s.actual_profit > 0])
        loss_signals = len([s for s in signals if s.actual_profit and s.actual_profit < 0])
        
        accuracy = (profitable_signals / (profitable_signals + loss_signals) * 100) if (profitable_signals + loss_signals) > 0 else 0
        average_confidence = sum([s.confidence_score for s in signals]) / total_signals
        
        return {
            "total_signals": total_signals,
            "accuracy": round(accuracy, 2),
            "average_confidence": round(average_confidence, 4),
            "profitable_signals": profitable_signals,
            "loss_signals": loss_signals,
            "pending_signals": total_signals - profitable_signals - loss_signals
        }
        
    except Exception as e:
        logger.error(f"Error getting signal performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve signal performance"
        )