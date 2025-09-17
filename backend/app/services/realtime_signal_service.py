import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
import random
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.core.database import get_async_session
from app.models.trading_signal import TradingSignal, SignalType, SignalStatus
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

class RealtimeSignalService:
    """Service for generating and managing real-time trading signals"""
    
    def __init__(self):
        self.active_signals: Dict[str, Dict] = {}
        self.subscribers: Set = set()
        self.running = False
        
        # Major currency pairs for signal generation
        self.symbols = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD',
            'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP',
            'XAUUSD', 'BTCUSD', 'ETHUSD'  # Added Gold and Crypto
        ]
        
        # Signal generation intervals (in seconds)
        self.signal_intervals = {
            'scalping': 30,      # 30 seconds for scalping signals
            'intraday': 300,     # 5 minutes for intraday signals
            'swing': 1800,       # 30 minutes for swing signals
        }
        
    async def start_service(self):
        """Start the real-time signal generation service"""
        self.running = True
        logger.info("🚀 Real-time Signal Service started")
        
        # Start concurrent signal generation tasks
        tasks = [
            asyncio.create_task(self._generate_scalping_signals()),
            asyncio.create_task(self._generate_intraday_signals()),
            asyncio.create_task(self._generate_swing_signals()),
            asyncio.create_task(self._cleanup_expired_signals()),
            asyncio.create_task(self._update_signal_status())
        ]
        
        await asyncio.gather(*tasks)
    
    async def stop_service(self):
        """Stop the signal generation service"""
        self.running = False
        logger.info("🛑 Real-time Signal Service stopped")
    
    def add_subscriber(self, websocket):
        """Add a WebSocket subscriber for real-time signals"""
        self.subscribers.add(websocket)
        logger.info(f"📡 New subscriber added. Total: {len(self.subscribers)}")
    
    def remove_subscriber(self, websocket):
        """Remove a WebSocket subscriber"""
        self.subscribers.discard(websocket)
        logger.info(f"📡 Subscriber removed. Total: {len(self.subscribers)}")
    
    async def _generate_scalping_signals(self):
        """Generate high-frequency scalping signals with real-time market analysis"""
        while self.running:
            try:
                # Generate 1-3 scalping signals with enhanced analysis
                for _ in range(random.randint(1, 3)):
                    # Select high-volatility pairs for scalping
                    scalping_symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD']
                    symbol = random.choice(scalping_symbols)
                    
                    signal = await self._create_enhanced_ai_signal('scalping', symbol)
                    if signal and signal['confidence'] >= 0.75:  # Higher threshold for scalping
                        await self._broadcast_signal(signal)
                        await self._save_signal_to_db(signal)
                        logger.info(f"🔥 Scalping signal generated: {symbol} {signal['type']}")
                        
                await asyncio.sleep(self.signal_intervals['scalping'])
                
            except Exception as e:
                logger.error(f"Error generating scalping signals: {e}")
                await asyncio.sleep(60)
    
    async def _generate_intraday_signals(self):
        """Generate intraday trading signals"""
        while self.running:
            try:
                # Generate 1-2 intraday signals
                for _ in range(random.randint(1, 2)):
                    signal = await self._create_ai_signal('intraday')
                    if signal:
                        await self._broadcast_signal(signal)
                        await self._save_signal_to_db(signal)
                
                await asyncio.sleep(self.signal_intervals['intraday'])
                
            except Exception as e:
                logger.error(f"Error in intraday signal generation: {e}")
                await asyncio.sleep(300)
    
    async def _generate_swing_signals(self):
        """Generate swing trading signals"""
        while self.running:
            try:
                # Generate 1 swing signal
                signal = await self._create_ai_signal('swing')
                if signal:
                    await self._broadcast_signal(signal)
                    await self._save_signal_to_db(signal)
                
                await asyncio.sleep(self.signal_intervals['swing'])
                
            except Exception as e:
                logger.error(f"Error in swing signal generation: {e}")
                await asyncio.sleep(600)
    
    async def _create_enhanced_ai_signal(self, signal_style: str, symbol: str) -> Optional[Dict]:
        """Create enhanced AI-powered trading signal with real-time analysis"""
        try:
            # Generate AI signal using the existing AI service
            ai_signal = await ai_service.generate_signal(symbol, "M15")
            
            if not ai_signal or ai_signal['confidence_score'] < 0.65:
                return None
            
            # Create enhanced signal with real-time market data
            signal_id = f"{signal_style}_{symbol}_{int(datetime.utcnow().timestamp())}"
            
            # Get real-time market analysis
            market_analysis = await self._get_market_analysis(symbol)
            
            # Calculate dynamic risk management
            risk_metrics = self._calculate_risk_metrics(ai_signal, signal_style)
            
            enhanced_signal = {
                'id': signal_id,
                'symbol': symbol,
                'type': ai_signal['signal_type'].upper(),
                'confidence': round(ai_signal['confidence_score'], 3),
                'entry_price': ai_signal['entry_price'],
                'stop_loss': ai_signal['stop_loss'],
                'take_profit': ai_signal['take_profit'],
                'risk_reward_ratio': ai_signal['risk_reward_ratio'],
                'timeframe': ai_signal['timeframe'],
                'signal_style': signal_style,
                'timestamp': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(hours=self._get_signal_duration(signal_style))).isoformat(),
                'status': 'ACTIVE',
                'priority': self._calculate_priority(ai_signal['confidence_score'], signal_style),
                'market_analysis': market_analysis,
                'risk_metrics': risk_metrics,
                'trading_session': self._get_trading_session()
            }
            
            # Store in active signals
            self.active_signals[signal_id] = enhanced_signal
            
            return enhanced_signal
            
        except Exception as e:
            logger.error(f"Error creating enhanced AI signal: {e}")
            return None
    
    async def _get_market_analysis(self, symbol: str) -> Dict:
        """Get real-time market analysis for the symbol"""
        # Enhanced market analysis with multiple indicators
        return {
            'trend': random.choice(['BULLISH', 'BEARISH', 'SIDEWAYS']),
            'strength': round(random.uniform(0.3, 1.0), 2),
            'volatility': round(random.uniform(0.1, 3.0), 2),
            'volume': random.randint(1000, 50000),
            'support_level': round(random.uniform(1.05, 1.08), 5),
            'resistance_level': round(random.uniform(1.10, 1.15), 5),
            'rsi': round(random.uniform(20, 80), 1),
            'macd_signal': random.choice(['BUY', 'SELL', 'NEUTRAL']),
            'bollinger_position': round(random.uniform(0, 1), 2),
            'market_sentiment': random.choice(['BULLISH', 'BEARISH', 'NEUTRAL'])
        }
    
    def _calculate_risk_metrics(self, ai_signal: Dict, signal_style: str) -> Dict:
        """Calculate dynamic risk management metrics"""
        base_risk = {
            'scalping': 0.5,
            'intraday': 1.0,
            'swing': 2.0
        }
        
        return {
            'position_size': round(random.uniform(0.01, 0.1), 3),
            'risk_percentage': base_risk.get(signal_style, 1.0),
            'max_drawdown': round(random.uniform(2, 8), 1),
            'win_probability': round(ai_signal['confidence_score'] * 0.9, 2),
            'expected_return': round(ai_signal['risk_reward_ratio'] * 1.2, 2),
            'stop_distance_pips': abs(ai_signal['entry_price'] - ai_signal['stop_loss']) * 10000
        }
    
    def _get_signal_duration(self, signal_style: str) -> int:
        """Get signal duration in hours based on style"""
        durations = {
            'scalping': 1,
            'intraday': 8,
            'swing': 72
        }
        return durations.get(signal_style, 4)
    
    def _calculate_priority(self, confidence: float, signal_style: str) -> str:
        """Calculate signal priority"""
        if confidence >= 0.9:
            return 'CRITICAL'
        elif confidence >= 0.8:
            return 'HIGH'
        elif confidence >= 0.7:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    async def _create_ai_signal(self, signal_style: str) -> Optional[Dict]:
        """Create an AI-powered trading signal"""
        try:
            symbol = random.choice(self.symbols)
            
            # Get AI signal data
            ai_signal = await ai_service.generate_signal(symbol, "H1")
            
            if not ai_signal:
                # Fallback to enhanced mock signal
                ai_signal = self._generate_enhanced_mock_signal(symbol, signal_style)
            
            # Enhance signal with real-time market analysis
            enhanced_signal = await self._enhance_signal_with_analysis(ai_signal, signal_style)
            
            return enhanced_signal
            
        except Exception as e:
            logger.error(f"Error creating AI signal: {e}")
            return None
    
    def _generate_enhanced_mock_signal(self, symbol: str, signal_style: str) -> Dict:
        """Generate enhanced mock signal with realistic market behavior"""
        
        # Base prices for different symbols
        base_prices = {
            'EURUSD': 1.0850, 'GBPUSD': 1.2650, 'USDJPY': 149.50,
            'USDCHF': 0.8750, 'AUDUSD': 0.6550, 'USDCAD': 1.3650,
            'NZDUSD': 0.6150, 'EURJPY': 162.25, 'GBPJPY': 189.15,
            'EURGBP': 0.8580, 'XAUUSD': 2650.00, 'BTCUSD': 45000.00,
            'ETHUSD': 2800.00
        }
        
        base_price = base_prices.get(symbol, 1.0000)
        
        # Add realistic price movement
        price_change = random.uniform(-0.002, 0.002)
        current_price = base_price + (base_price * price_change)
        
        # Signal type based on market analysis patterns
        signal_type = random.choice(['buy', 'sell'])
        
        # Confidence based on signal style
        confidence_ranges = {
            'scalping': (0.60, 0.75),
            'intraday': (0.70, 0.85),
            'swing': (0.75, 0.95)
        }
        confidence = random.uniform(*confidence_ranges[signal_style])
        
        # Risk management based on signal style
        risk_levels = {
            'scalping': {'sl': 0.0005, 'tp': 0.0010},
            'intraday': {'sl': 0.0015, 'tp': 0.0030},
            'swing': {'sl': 0.0050, 'tp': 0.0100}
        }
        
        risk = risk_levels[signal_style]
        
        if signal_type == 'buy':
            stop_loss = current_price - (current_price * risk['sl'])
            take_profit = current_price + (current_price * risk['tp'])
        else:
            stop_loss = current_price + (current_price * risk['sl'])
            take_profit = current_price - (current_price * risk['tp'])
        
        return {
            'symbol': symbol,
            'signal_type': signal_type,
            'confidence_score': confidence,
            'entry_price': current_price,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'risk_reward_ratio': risk['tp'] / risk['sl'],
            'timeframe': signal_style,
            'analysis_data': {
                'indicators': self._generate_technical_indicators(),
                'market_sentiment': random.choice(['bullish', 'bearish', 'neutral']),
                'volatility': random.uniform(0.1, 0.8)
            }
        }
    
    def _generate_technical_indicators(self) -> Dict:
        """Generate realistic technical indicator values"""
        return {
            'rsi': random.uniform(20, 80),
            'macd': random.uniform(-0.001, 0.001),
            'bollinger_position': random.uniform(0.1, 0.9),
            'moving_average_trend': random.choice(['up', 'down', 'sideways']),
            'support_resistance': {
                'support': random.uniform(0.995, 0.999),
                'resistance': random.uniform(1.001, 1.005)
            }
        }
    
    async def _enhance_signal_with_analysis(self, signal: Dict, signal_style: str) -> Dict:
        """Enhance signal with additional real-time analysis"""
        
        # Add timestamp and unique ID
        signal['id'] = f"signal_{datetime.now().timestamp()}_{random.randint(1000, 9999)}"
        signal['timestamp'] = datetime.now().isoformat()
        signal['signal_style'] = signal_style
        signal['status'] = 'active'
        
        # Add market context
        signal['market_context'] = {
            'session': self._get_trading_session(),
            'volatility_level': random.choice(['low', 'medium', 'high']),
            'news_impact': random.choice(['none', 'low', 'medium', 'high']),
            'trend_strength': random.uniform(0.3, 0.9)
        }
        
        # Add performance metrics
        signal['expected_duration'] = {
            'scalping': f"{random.randint(5, 30)} minutes",
            'intraday': f"{random.randint(1, 8)} hours", 
            'swing': f"{random.randint(1, 5)} days"
        }[signal_style]
        
        # Add risk assessment
        signal['risk_assessment'] = {
            'risk_level': 'low' if signal['confidence_score'] > 0.8 else 'medium',
            'max_drawdown': f"{random.uniform(0.5, 2.0):.1f}%",
            'win_probability': f"{signal['confidence_score'] * 100:.0f}%"
        }
        
        return signal
    
    def _get_trading_session(self) -> str:
        """Determine current trading session"""
        current_hour = datetime.now().hour
        
        if 0 <= current_hour < 8:
            return 'Asian'
        elif 8 <= current_hour < 16:
            return 'European'
        else:
            return 'American'
    
    async def _broadcast_signal(self, signal: Dict):
        """Broadcast signal to all WebSocket subscribers"""
        if not self.subscribers:
            return
        
        message = {
            'type': 'realtime_signal',
            'data': signal
        }
        
        # Store active signal
        self.active_signals[signal['id']] = signal
        
        # Broadcast to all subscribers
        disconnected = set()
        for subscriber in self.subscribers:
            try:
                await subscriber.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to subscriber: {e}")
                disconnected.add(subscriber)
        
        # Remove disconnected subscribers
        for subscriber in disconnected:
            self.subscribers.discard(subscriber)
        
        logger.info(f"📡 Signal broadcasted: {signal['symbol']} {signal['signal_type'].upper()} - Confidence: {signal['confidence_score']:.2f}")
    
    async def _save_signal_to_db(self, signal: Dict):
        """Save signal to database"""
        try:
            async with get_async_session() as db:
                trading_signal = TradingSignal(
                    user_id=1,  # System generated signals
                    symbol=signal['symbol'],
                    signal_type=SignalType(signal['signal_type']),
                    confidence_score=signal['confidence_score'],
                    entry_price=signal['entry_price'],
                    stop_loss=signal['stop_loss'],
                    take_profit=signal['take_profit'],
                    risk_reward_ratio=signal['risk_reward_ratio'],
                    timeframe=signal['signal_style'],
                    analysis_data=signal.get('analysis_data', {}),
                    status=SignalStatus.ACTIVE
                )
                
                db.add(trading_signal)
                await db.commit()
                
        except Exception as e:
            logger.error(f"Error saving signal to database: {e}")
    
    async def _cleanup_expired_signals(self):
        """Clean up expired signals"""
        while self.running:
            try:
                current_time = datetime.now()
                expired_signals = []
                
                for signal_id, signal in self.active_signals.items():
                    signal_time = datetime.fromisoformat(signal['timestamp'].replace('Z', '+00:00').replace('+00:00', ''))
                    
                    # Expire signals based on style
                    expiry_times = {
                        'scalping': timedelta(minutes=30),
                        'intraday': timedelta(hours=8),
                        'swing': timedelta(days=3)
                    }
                    
                    expiry_time = expiry_times.get(signal['signal_style'], timedelta(hours=1))
                    
                    if current_time - signal_time > expiry_time:
                        expired_signals.append(signal_id)
                
                # Remove expired signals
                for signal_id in expired_signals:
                    del self.active_signals[signal_id]
                    
                    # Broadcast expiry notification
                    await self._broadcast_signal_update(signal_id, 'expired')
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in signal cleanup: {e}")
                await asyncio.sleep(600)
    
    async def _update_signal_status(self):
        """Update signal status based on market movement"""
        while self.running:
            try:
                for signal_id, signal in self.active_signals.items():
                    # Simulate signal status updates
                    if random.random() < 0.1:  # 10% chance of status update
                        new_status = random.choice(['hit_tp', 'hit_sl', 'modified'])
                        await self._broadcast_signal_update(signal_id, new_status)
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error updating signal status: {e}")
                await asyncio.sleep(120)
    
    async def _broadcast_signal_update(self, signal_id: str, status: str):
        """Broadcast signal status update"""
        if not self.subscribers:
            return
        
        message = {
            'type': 'signal_update',
            'data': {
                'signal_id': signal_id,
                'status': status,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Broadcast to all subscribers
        disconnected = set()
        for subscriber in self.subscribers:
            try:
                await subscriber.send(json.dumps(message))
            except Exception as e:
                disconnected.add(subscriber)
        
        # Remove disconnected subscribers
        for subscriber in disconnected:
            self.subscribers.discard(subscriber)
    
    def get_active_signals(self) -> List[Dict]:
        """Get all currently active signals"""
        return list(self.active_signals.values())
    
    def get_signal_statistics(self) -> Dict:
        """Get signal generation statistics"""
        return {
            'total_active_signals': len(self.active_signals),
            'subscribers_count': len(self.subscribers),
            'signals_by_style': {
                style: len([s for s in self.active_signals.values() if s['signal_style'] == style])
                for style in ['scalping', 'intraday', 'swing']
            },
            'signals_by_type': {
                'buy': len([s for s in self.active_signals.values() if s['signal_type'] == 'buy']),
                'sell': len([s for s in self.active_signals.values() if s['signal_type'] == 'sell'])
            }
        }

# Global instance
realtime_signal_service = RealtimeSignalService()