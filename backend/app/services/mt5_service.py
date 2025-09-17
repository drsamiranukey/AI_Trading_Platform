import MetaTrader5 as mt5
import asyncio
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.config import settings
from app.models.mt5_account import MT5Account
from app.models.trade import Trade, TradeType, TradeStatus
from app.models.trading_signal import TradingSignal

logger = logging.getLogger(__name__)


class MT5Service:
    def __init__(self):
        self.encryption_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)
        self.connected_accounts = {}
    
    def encrypt_password(self, password: str) -> str:
        """Encrypt MT5 password for secure storage."""
        return self.cipher_suite.encrypt(password.encode()).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        """Decrypt MT5 password for connection."""
        return self.cipher_suite.decrypt(encrypted_password.encode()).decode()
    
    async def connect_mt5_account(self, account: MT5Account) -> bool:
        """Connect to MT5 account."""
        try:
            # Decrypt password
            password = self.decrypt_password(account.encrypted_password)
            
            # Initialize MT5 connection
            if not mt5.initialize():
                logger.error(f"MT5 initialization failed for account {account.account_number}")
                return False
            
            # Login to account
            login_result = mt5.login(
                login=int(account.account_number),
                password=password,
                server=account.server,
                timeout=settings.MT5_SERVER_TIMEOUT
            )
            
            if not login_result:
                error = mt5.last_error()
                logger.error(f"MT5 login failed for account {account.account_number}: {error}")
                account.connection_error = f"Login failed: {error}"
                return False
            
            # Store connection
            self.connected_accounts[account.id] = {
                'account': account,
                'connected_at': datetime.utcnow()
            }
            
            # Update account status
            account.is_connected = True
            account.last_connection = datetime.utcnow()
            account.connection_error = None
            
            logger.info(f"Successfully connected to MT5 account {account.account_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to MT5 account {account.account_number}: {str(e)}")
            account.connection_error = str(e)
            return False
    
    async def disconnect_mt5_account(self, account_id: int) -> bool:
        """Disconnect from MT5 account."""
        try:
            if account_id in self.connected_accounts:
                mt5.shutdown()
                del self.connected_accounts[account_id]
                logger.info(f"Disconnected from MT5 account {account_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error disconnecting from MT5 account {account_id}: {str(e)}")
            return False
    
    async def get_account_info(self, account: MT5Account) -> Optional[Dict]:
        """Get MT5 account information."""
        try:
            if not await self.connect_mt5_account(account):
                return None
            
            account_info = mt5.account_info()
            if account_info is None:
                return None
            
            return {
                'balance': account_info.balance,
                'equity': account_info.equity,
                'margin': account_info.margin,
                'free_margin': account_info.margin_free,
                'leverage': account_info.leverage,
                'currency': account_info.currency,
                'profit': account_info.profit,
                'margin_level': account_info.margin_level
            }
        except Exception as e:
            logger.error(f"Error getting account info: {str(e)}")
            return None
    
    async def get_symbol_info(self, symbol: str) -> Optional[Dict]:
        """Get symbol information."""
        try:
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return None
            
            return {
                'symbol': symbol_info.name,
                'bid': symbol_info.bid,
                'ask': symbol_info.ask,
                'spread': symbol_info.spread,
                'digits': symbol_info.digits,
                'point': symbol_info.point,
                'volume_min': symbol_info.volume_min,
                'volume_max': symbol_info.volume_max,
                'volume_step': symbol_info.volume_step
            }
        except Exception as e:
            logger.error(f"Error getting symbol info for {symbol}: {str(e)}")
            return None
    
    async def place_order(self, account: MT5Account, signal: TradingSignal, volume: float) -> Optional[Dict]:
        """Place a trading order based on signal."""
        try:
            if not await self.connect_mt5_account(account):
                return None
            
            symbol_info = await self.get_symbol_info(signal.symbol)
            if not symbol_info:
                return None
            
            # Determine order type
            order_type = mt5.ORDER_TYPE_BUY if signal.signal_type == "buy" else mt5.ORDER_TYPE_SELL
            price = symbol_info['ask'] if signal.signal_type == "buy" else symbol_info['bid']
            
            # Prepare order request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": signal.symbol,
                "volume": volume,
                "type": order_type,
                "price": price,
                "sl": signal.stop_loss,
                "tp": signal.take_profit,
                "deviation": 20,
                "magic": 234000,
                "comment": f"AI Signal {signal.id}",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            # Send order
            result = mt5.order_send(request)
            
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                logger.error(f"Order failed: {result.retcode} - {result.comment}")
                return None
            
            return {
                'ticket': result.order,
                'volume': result.volume,
                'price': result.price,
                'bid': result.bid,
                'ask': result.ask,
                'comment': result.comment,
                'request_id': result.request_id
            }
            
        except Exception as e:
            logger.error(f"Error placing order: {str(e)}")
            return None
    
    async def close_position(self, account: MT5Account, ticket: int) -> bool:
        """Close an open position."""
        try:
            if not await self.connect_mt5_account(account):
                return False
            
            # Get position info
            position = mt5.positions_get(ticket=ticket)
            if not position:
                return False
            
            position = position[0]
            
            # Determine close order type
            order_type = mt5.ORDER_TYPE_SELL if position.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
            price = mt5.symbol_info_tick(position.symbol).bid if position.type == mt5.POSITION_TYPE_BUY else mt5.symbol_info_tick(position.symbol).ask
            
            # Prepare close request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": position.symbol,
                "volume": position.volume,
                "type": order_type,
                "position": ticket,
                "price": price,
                "deviation": 20,
                "magic": 234000,
                "comment": "Close by AI",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            # Send close order
            result = mt5.order_send(request)
            return result.retcode == mt5.TRADE_RETCODE_DONE
            
        except Exception as e:
            logger.error(f"Error closing position {ticket}: {str(e)}")
            return False
    
    async def get_open_positions(self, account: MT5Account) -> List[Dict]:
        """Get all open positions."""
        try:
            if not await self.connect_mt5_account(account):
                return []
            
            positions = mt5.positions_get()
            if positions is None:
                return []
            
            result = []
            for position in positions:
                result.append({
                    'ticket': position.ticket,
                    'symbol': position.symbol,
                    'type': 'buy' if position.type == mt5.POSITION_TYPE_BUY else 'sell',
                    'volume': position.volume,
                    'price_open': position.price_open,
                    'price_current': position.price_current,
                    'profit': position.profit,
                    'swap': position.swap,
                    'time': position.time,
                    'comment': position.comment
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting open positions: {str(e)}")
            return []
    
    async def get_trade_history(self, account: MT5Account, days: int = 30) -> List[Dict]:
        """Get trade history."""
        try:
            if not await self.connect_mt5_account(account):
                return []
            
            # Get history for last N days
            from_date = datetime.now() - timedelta(days=days)
            to_date = datetime.now()
            
            deals = mt5.history_deals_get(from_date, to_date)
            if deals is None:
                return []
            
            result = []
            for deal in deals:
                result.append({
                    'ticket': deal.ticket,
                    'order': deal.order,
                    'symbol': deal.symbol,
                    'type': 'buy' if deal.type == mt5.DEAL_TYPE_BUY else 'sell',
                    'volume': deal.volume,
                    'price': deal.price,
                    'profit': deal.profit,
                    'swap': deal.swap,
                    'commission': deal.commission,
                    'time': deal.time,
                    'comment': deal.comment
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting trade history: {str(e)}")
            return []
    
    async def update_account_balance(self, db: AsyncSession, account: MT5Account):
        """Update account balance information."""
        try:
            account_info = await self.get_account_info(account)
            if account_info:
                account.balance = account_info['balance']
                account.equity = account_info['equity']
                account.margin = account_info['margin']
                account.free_margin = account_info['free_margin']
                await db.commit()
        except Exception as e:
            logger.error(f"Error updating account balance: {str(e)}")


# Global MT5 service instance
mt5_service = MT5Service()