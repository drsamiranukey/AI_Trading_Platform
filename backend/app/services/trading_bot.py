import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.models.user import User
from app.models.mt5_account import MT5Account
from app.models.trading_signal import TradingSignal
from app.models.trade import Trade, TradeType, TradeStatus
from app.models.payment import BotConfiguration
from app.services.mt5_service import mt5_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class TradingBot:
    def __init__(self):
        self.active_bots = {}
        self.running = False
        
    async def start_bot(self, user_id: int, mt5_account_id: int, config: BotConfiguration):
        """Start trading bot for a user."""
        try:
            bot_key = f"{user_id}_{mt5_account_id}"
            
            if bot_key in self.active_bots:
                logger.warning(f"Bot already running for user {user_id}, account {mt5_account_id}")
                return False
            
            self.active_bots[bot_key] = {
                'user_id': user_id,
                'mt5_account_id': mt5_account_id,
                'config': config,
                'started_at': datetime.utcnow(),
                'trades_today': 0,
                'daily_pnl': 0.0,
                'last_signal_check': datetime.utcnow()
            }
            
            logger.info(f"Trading bot started for user {user_id}, account {mt5_account_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting trading bot: {str(e)}")
            return False
    
    async def stop_bot(self, user_id: int, mt5_account_id: int):
        """Stop trading bot for a user."""
        try:
            bot_key = f"{user_id}_{mt5_account_id}"
            
            if bot_key in self.active_bots:
                del self.active_bots[bot_key]
                logger.info(f"Trading bot stopped for user {user_id}, account {mt5_account_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error stopping trading bot: {str(e)}")
            return False
    
    async def check_risk_limits(self, bot_data: Dict, account: MT5Account) -> bool:
        """Check if trading is allowed based on risk limits."""
        try:
            config = bot_data['config']
            
            # Check daily trade limit
            if config.max_trades_per_day and bot_data['trades_today'] >= config.max_trades_per_day:
                logger.warning(f"Daily trade limit reached for account {account.id}")
                return False
            
            # Check daily loss limit
            if config.max_daily_loss and bot_data['daily_pnl'] <= -config.max_daily_loss:
                logger.warning(f"Daily loss limit reached for account {account.id}")
                return False
            
            # Check account balance
            account_info = await mt5_service.get_account_info(account)
            if account_info:
                # Check minimum balance
                if account_info['balance'] < config.min_balance:
                    logger.warning(f"Account balance below minimum for account {account.id}")
                    return False
                
                # Check margin level
                if account_info['margin_level'] < 100:  # Less than 100% margin level
                    logger.warning(f"Insufficient margin for account {account.id}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking risk limits: {str(e)}")
            return False
    
    async def calculate_position_size(self, account: MT5Account, signal: TradingSignal, config: BotConfiguration) -> float:
        """Calculate position size based on risk management rules."""
        try:
            account_info = await mt5_service.get_account_info(account)
            if not account_info:
                return 0.0
            
            balance = account_info['balance']
            
            # Calculate risk amount
            risk_amount = balance * (config.risk_per_trade / 100)
            
            # Calculate stop loss distance in points
            if signal.stop_loss:
                stop_loss_distance = abs(signal.entry_price - signal.stop_loss)
                
                # Get symbol info for point value calculation
                symbol_info = await mt5_service.get_symbol_info(signal.symbol)
                if symbol_info:
                    # Calculate position size based on risk
                    point_value = symbol_info['point']
                    pip_value = 10 * point_value if 'JPY' in signal.symbol else point_value
                    
                    # Position size = Risk Amount / (Stop Loss Distance / Point Value)
                    position_size = risk_amount / (stop_loss_distance / pip_value)
                    
                    # Apply volume constraints
                    min_volume = symbol_info['volume_min']
                    max_volume = min(symbol_info['volume_max'], config.max_position_size)
                    
                    position_size = max(min_volume, min(position_size, max_volume))
                    
                    # Round to volume step
                    volume_step = symbol_info['volume_step']
                    position_size = round(position_size / volume_step) * volume_step
                    
                    return position_size
            
            # Fallback: use fixed percentage of balance
            return min(balance * 0.01, config.max_position_size)  # 1% of balance
            
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            return 0.0
    
    async def execute_signal(self, signal: TradingSignal, account: MT5Account, config: BotConfiguration, db: AsyncSession) -> Optional[Trade]:
        """Execute a trading signal."""
        try:
            # Calculate position size
            volume = await self.calculate_position_size(account, signal, config)
            
            if volume <= 0:
                logger.warning(f"Invalid position size calculated for signal {signal.id}")
                return None
            
            # Place order
            order_result = await mt5_service.place_order(account, signal, volume)
            
            if not order_result:
                logger.error(f"Failed to place order for signal {signal.id}")
                return None
            
            # Create trade record
            trade = Trade(
                user_id=account.user_id,
                mt5_account_id=account.id,
                signal_id=signal.id,
                symbol=signal.symbol,
                trade_type=TradeType.BUY if signal.signal_type == "buy" else TradeType.SELL,
                volume=volume,
                entry_price=order_result['price'],
                stop_loss=signal.stop_loss,
                take_profit=signal.take_profit,
                mt5_ticket=order_result['ticket'],
                status=TradeStatus.OPEN,
                opened_at=datetime.utcnow()
            )
            
            db.add(trade)
            
            # Update signal status
            signal.status = "executed"
            signal.actual_entry_price = order_result['price']
            signal.execution_time = datetime.utcnow()
            
            await db.commit()
            await db.refresh(trade)
            
            logger.info(f"Signal {signal.id} executed successfully, trade {trade.id} created")
            return trade
            
        except Exception as e:
            logger.error(f"Error executing signal {signal.id}: {str(e)}")
            await db.rollback()
            return None
    
    async def monitor_trades(self, bot_data: Dict, account: MT5Account, db: AsyncSession):
        """Monitor open trades and manage exits."""
        try:
            # Get open trades for this account
            result = await db.execute(
                select(Trade).where(
                    Trade.mt5_account_id == account.id,
                    Trade.status == TradeStatus.OPEN
                )
            )
            open_trades = result.scalars().all()
            
            for trade in open_trades:
                try:
                    # Get current position info
                    positions = await mt5_service.get_open_positions(account)
                    position = next((p for p in positions if p['ticket'] == trade.mt5_ticket), None)
                    
                    if not position:
                        # Position closed externally, update trade
                        trade.status = TradeStatus.CLOSED
                        trade.closed_at = datetime.utcnow()
                        trade.exit_price = trade.entry_price  # Fallback
                        continue
                    
                    # Update current price and profit
                    trade.current_price = position['price_current']
                    trade.unrealized_pnl = position['profit']
                    
                    # Check exit conditions
                    should_close = False
                    close_reason = ""
                    
                    # Check stop loss and take profit (handled by MT5)
                    # Check time-based exit
                    config = bot_data['config']
                    if config.max_trade_duration_hours:
                        trade_duration = (datetime.utcnow() - trade.opened_at).total_seconds() / 3600
                        if trade_duration > config.max_trade_duration_hours:
                            should_close = True
                            close_reason = "Max duration reached"
                    
                    # Check trailing stop
                    if config.use_trailing_stop and trade.take_profit:
                        # Implement trailing stop logic
                        if trade.trade_type == TradeType.BUY:
                            if position['price_current'] > trade.entry_price:
                                new_stop = position['price_current'] - (config.trailing_stop_distance or 0.001)
                                if not trade.stop_loss or new_stop > trade.stop_loss:
                                    # Update stop loss (would need MT5 modification)
                                    pass
                        else:  # SELL
                            if position['price_current'] < trade.entry_price:
                                new_stop = position['price_current'] + (config.trailing_stop_distance or 0.001)
                                if not trade.stop_loss or new_stop < trade.stop_loss:
                                    # Update stop loss (would need MT5 modification)
                                    pass
                    
                    # Close position if needed
                    if should_close:
                        success = await mt5_service.close_position(account, trade.mt5_ticket)
                        if success:
                            trade.status = TradeStatus.CLOSED
                            trade.closed_at = datetime.utcnow()
                            trade.exit_price = position['price_current']
                            trade.realized_pnl = position['profit']
                            trade.close_reason = close_reason
                            
                            # Update bot daily PnL
                            bot_data['daily_pnl'] += position['profit']
                            
                            logger.info(f"Trade {trade.id} closed: {close_reason}")
                
                except Exception as e:
                    logger.error(f"Error monitoring trade {trade.id}: {str(e)}")
                    continue
            
            await db.commit()
            
        except Exception as e:
            logger.error(f"Error monitoring trades: {str(e)}")
    
    async def process_signals(self, bot_data: Dict, account: MT5Account, db: AsyncSession):
        """Process new signals for automated trading."""
        try:
            config = bot_data['config']
            
            # Check if signal processing is enabled
            if not config.auto_execute_signals:
                return
            
            # Get new signals
            result = await db.execute(
                select(TradingSignal).where(
                    TradingSignal.user_id == bot_data['user_id'],
                    TradingSignal.status == "active",
                    TradingSignal.created_at > bot_data['last_signal_check']
                )
            )
            new_signals = result.scalars().all()
            
            for signal in new_signals:
                try:
                    # Check signal filters
                    if config.min_confidence_score and signal.confidence_score < config.min_confidence_score:
                        continue
                    
                    if config.allowed_symbols and signal.symbol not in config.allowed_symbols:
                        continue
                    
                    # Check risk limits before executing
                    if not await self.check_risk_limits(bot_data, account):
                        break
                    
                    # Execute signal
                    trade = await self.execute_signal(signal, account, config, db)
                    if trade:
                        bot_data['trades_today'] += 1
                        logger.info(f"Auto-executed signal {signal.id} for account {account.id}")
                
                except Exception as e:
                    logger.error(f"Error processing signal {signal.id}: {str(e)}")
                    continue
            
            # Update last signal check time
            bot_data['last_signal_check'] = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Error processing signals: {str(e)}")
    
    async def run_bot_cycle(self):
        """Run one cycle of the trading bot."""
        if not self.active_bots:
            return
        
        async for db in get_db():
            try:
                for bot_key, bot_data in list(self.active_bots.items()):
                    try:
                        # Get account
                        result = await db.execute(
                            select(MT5Account).where(MT5Account.id == bot_data['mt5_account_id'])
                        )
                        account = result.scalar_one_or_none()
                        
                        if not account:
                            logger.error(f"Account not found for bot {bot_key}")
                            del self.active_bots[bot_key]
                            continue
                        
                        # Check if account is connected
                        if not account.is_connected:
                            # Try to reconnect
                            if not await mt5_service.connect_mt5_account(account):
                                logger.warning(f"Failed to connect account {account.id}")
                                continue
                        
                        # Reset daily counters if new day
                        now = datetime.utcnow()
                        if now.date() > bot_data['started_at'].date():
                            bot_data['trades_today'] = 0
                            bot_data['daily_pnl'] = 0.0
                            bot_data['started_at'] = now
                        
                        # Monitor existing trades
                        await self.monitor_trades(bot_data, account, db)
                        
                        # Process new signals
                        await self.process_signals(bot_data, account, db)
                        
                    except Exception as e:
                        logger.error(f"Error in bot cycle for {bot_key}: {str(e)}")
                        continue
                        
            except Exception as e:
                logger.error(f"Error in bot cycle: {str(e)}")
            finally:
                await db.close()
    
    async def start_main_loop(self):
        """Start the main trading bot loop."""
        self.running = True
        logger.info("Trading bot main loop started")
        
        while self.running:
            try:
                await self.run_bot_cycle()
                await asyncio.sleep(30)  # Run every 30 seconds
            except Exception as e:
                logger.error(f"Error in main bot loop: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def stop_main_loop(self):
        """Stop the main trading bot loop."""
        self.running = False
        self.active_bots.clear()
        logger.info("Trading bot main loop stopped")
    
    def get_bot_status(self, user_id: int, mt5_account_id: int) -> Optional[Dict]:
        """Get status of a trading bot."""
        bot_key = f"{user_id}_{mt5_account_id}"
        return self.active_bots.get(bot_key)
    
    def get_all_active_bots(self) -> Dict:
        """Get all active bots."""
        return self.active_bots.copy()


# Global trading bot instance
trading_bot = TradingBot()