from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Dict, Any
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.mt5_account import MT5Account
from app.models.trade import Trade
from app.schemas.mt5 import (
    MT5AccountCreate, MT5AccountUpdate, MT5AccountResponse,
    MT5AccountInfo, MT5PositionResponse, MT5TradeHistoryResponse
)
from app.services.mt5_service import mt5_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/accounts", response_model=MT5AccountResponse)
async def create_mt5_account(
    account_data: MT5AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new MT5 account connection."""
    try:
        # Check if account already exists
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.user_id == current_user.id,
                MT5Account.account_number == account_data.account_number
            )
        )
        existing_account = result.scalar_one_or_none()
        
        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MT5 account already exists"
            )
        
        # Encrypt password
        encrypted_password = mt5_service.encrypt_password(account_data.password)
        
        # Create new account
        mt5_account = MT5Account(
            user_id=current_user.id,
            account_number=account_data.account_number,
            server=account_data.server,
            encrypted_password=encrypted_password,
            account_name=account_data.account_name,
            is_demo=account_data.is_demo,
            max_risk_per_trade=account_data.max_risk_per_trade,
            max_daily_loss=account_data.max_daily_loss,
            auto_trading_enabled=account_data.auto_trading_enabled
        )
        
        db.add(mt5_account)
        await db.commit()
        await db.refresh(mt5_account)
        
        # Test connection
        connection_success = await mt5_service.connect_mt5_account(mt5_account)
        if connection_success:
            # Update account info
            await mt5_service.update_account_balance(db, mt5_account)
        
        await db.commit()
        
        return MT5AccountResponse.from_orm(mt5_account)
        
    except Exception as e:
        logger.error(f"Error creating MT5 account: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create MT5 account"
        )


@router.get("/accounts", response_model=List[MT5AccountResponse])
async def get_mt5_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all MT5 accounts for the current user."""
    try:
        result = await db.execute(
            select(MT5Account).where(MT5Account.user_id == current_user.id)
        )
        accounts = result.scalars().all()
        
        return [MT5AccountResponse.from_orm(account) for account in accounts]
        
    except Exception as e:
        logger.error(f"Error getting MT5 accounts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve MT5 accounts"
        )


@router.get("/accounts/{account_id}", response_model=MT5AccountResponse)
async def get_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        return MT5AccountResponse.from_orm(account)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting MT5 account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve MT5 account"
        )


@router.put("/accounts/{account_id}", response_model=MT5AccountResponse)
async def update_mt5_account(
    account_id: int,
    account_data: MT5AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        # Update fields
        update_data = account_data.dict(exclude_unset=True)
        
        # Handle password encryption if provided
        if 'password' in update_data:
            update_data['encrypted_password'] = mt5_service.encrypt_password(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(account, field, value)
        
        await db.commit()
        await db.refresh(account)
        
        return MT5AccountResponse.from_orm(account)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating MT5 account: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update MT5 account"
        )


@router.delete("/accounts/{account_id}")
async def delete_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        # Disconnect if connected
        await mt5_service.disconnect_mt5_account(account_id)
        
        await db.delete(account)
        await db.commit()
        
        return {"message": "MT5 account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting MT5 account: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete MT5 account"
        )


@router.post("/accounts/{account_id}/connect")
async def connect_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Connect to an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        success = await mt5_service.connect_mt5_account(account)
        
        if success:
            # Update account info
            await mt5_service.update_account_balance(db, account)
            await db.commit()
            return {"message": "Successfully connected to MT5 account", "connected": True}
        else:
            await db.commit()  # Save any error messages
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to connect: {account.connection_error or 'Unknown error'}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error connecting to MT5 account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to MT5 account"
        )


@router.post("/accounts/{account_id}/disconnect")
async def disconnect_mt5_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect from an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        success = await mt5_service.disconnect_mt5_account(account_id)
        
        # Update connection status
        account.is_connected = False
        await db.commit()
        
        return {"message": "Disconnected from MT5 account", "connected": False}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting from MT5 account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect from MT5 account"
        )


@router.get("/accounts/{account_id}/info", response_model=MT5AccountInfo)
async def get_account_info(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get MT5 account information."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        account_info = await mt5_service.get_account_info(account)
        
        if not account_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve account information"
            )
        
        return MT5AccountInfo(**account_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account information"
        )


@router.get("/accounts/{account_id}/positions", response_model=List[MT5PositionResponse])
async def get_open_positions(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get open positions for an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        positions = await mt5_service.get_open_positions(account)
        
        return [MT5PositionResponse(**pos) for pos in positions]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting open positions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve open positions"
        )


@router.get("/accounts/{account_id}/history", response_model=List[MT5TradeHistoryResponse])
async def get_trade_history(
    account_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get trade history for an MT5 account."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        history = await mt5_service.get_trade_history(account, days)
        
        return [MT5TradeHistoryResponse(**trade) for trade in history]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trade history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trade history"
        )


@router.post("/accounts/{account_id}/positions/{ticket}/close")
async def close_position(
    account_id: int,
    ticket: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Close an open position."""
    try:
        result = await db.execute(
            select(MT5Account).where(
                MT5Account.id == account_id,
                MT5Account.user_id == current_user.id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MT5 account not found"
            )
        
        success = await mt5_service.close_position(account, ticket)
        
        if success:
            return {"message": "Position closed successfully", "ticket": ticket}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to close position"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing position: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to close position"
        )