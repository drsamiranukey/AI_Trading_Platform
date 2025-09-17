import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import ta
import MetaTrader5 as mt5
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.trading_signal import TradingSignal
from app.models.trade import Trade
from app.core.config import settings

logger = logging.getLogger(__name__)


class AITradingService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = []
        
    async def get_market_data(self, symbol: str, timeframe: str = "H1", count: int = 1000) -> Optional[pd.DataFrame]:
        """Get historical market data for analysis."""
        try:
            # Map timeframe string to MT5 constant
            timeframe_map = {
                "M1": mt5.TIMEFRAME_M1,
                "M5": mt5.TIMEFRAME_M5,
                "M15": mt5.TIMEFRAME_M15,
                "M30": mt5.TIMEFRAME_M30,
                "H1": mt5.TIMEFRAME_H1,
                "H4": mt5.TIMEFRAME_H4,
                "D1": mt5.TIMEFRAME_D1
            }
            
            mt5_timeframe = timeframe_map.get(timeframe, mt5.TIMEFRAME_H1)
            
            # Get rates
            rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
            if rates is None or len(rates) == 0:
                logger.error(f"No data received for {symbol}")
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            df.set_index('time', inplace=True)
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting market data for {symbol}: {str(e)}")
            return None
    
    def calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators for the dataset."""
        try:
            # Price-based indicators
            df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20)
            df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50)
            df['ema_12'] = ta.trend.ema_indicator(df['close'], window=12)
            df['ema_26'] = ta.trend.ema_indicator(df['close'], window=26)
            
            # Bollinger Bands
            bb = ta.volatility.BollingerBands(df['close'])
            df['bb_upper'] = bb.bollinger_hband()
            df['bb_middle'] = bb.bollinger_mavg()
            df['bb_lower'] = bb.bollinger_lband()
            df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
            
            # RSI
            df['rsi'] = ta.momentum.rsi(df['close'], window=14)
            
            # MACD
            macd = ta.trend.MACD(df['close'])
            df['macd'] = macd.macd()
            df['macd_signal'] = macd.macd_signal()
            df['macd_histogram'] = macd.macd_diff()
            
            # Stochastic
            stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'])
            df['stoch_k'] = stoch.stoch()
            df['stoch_d'] = stoch.stoch_signal()
            
            # ATR (Average True Range)
            df['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'])
            
            # Volume indicators (if volume data available)
            if 'tick_volume' in df.columns:
                df['volume_sma'] = ta.volume.volume_sma(df['close'], df['tick_volume'])
                df['volume_ratio'] = df['tick_volume'] / df['volume_sma']
            
            # Price patterns
            df['price_change'] = df['close'].pct_change()
            df['high_low_ratio'] = (df['high'] - df['low']) / df['close']
            df['open_close_ratio'] = (df['close'] - df['open']) / df['open']
            
            # Trend indicators
            df['price_above_sma20'] = (df['close'] > df['sma_20']).astype(int)
            df['price_above_sma50'] = (df['close'] > df['sma_50']).astype(int)
            df['sma20_above_sma50'] = (df['sma_20'] > df['sma_50']).astype(int)
            
            return df
            
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {str(e)}")
            return df
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for ML model."""
        try:
            # Calculate technical indicators
            df = self.calculate_technical_indicators(df)
            
            # Select features for the model
            feature_columns = [
                'sma_20', 'sma_50', 'ema_12', 'ema_26',
                'bb_width', 'rsi', 'macd', 'macd_signal', 'macd_histogram',
                'stoch_k', 'stoch_d', 'atr', 'price_change', 'high_low_ratio',
                'open_close_ratio', 'price_above_sma20', 'price_above_sma50', 'sma20_above_sma50'
            ]
            
            # Add lagged features
            for col in ['close', 'rsi', 'macd']:
                if col in df.columns:
                    df[f'{col}_lag1'] = df[col].shift(1)
                    df[f'{col}_lag2'] = df[col].shift(2)
                    feature_columns.extend([f'{col}_lag1', f'{col}_lag2'])
            
            # Store feature columns
            self.feature_columns = [col for col in feature_columns if col in df.columns]
            
            # Drop rows with NaN values
            df = df.dropna()
            
            return df
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            return df
    
    def create_labels(self, df: pd.DataFrame, lookahead: int = 5, threshold: float = 0.001) -> pd.DataFrame:
        """Create labels for supervised learning."""
        try:
            # Calculate future returns
            df['future_return'] = df['close'].shift(-lookahead) / df['close'] - 1
            
            # Create labels: 1 for buy, 0 for hold, -1 for sell
            df['label'] = 0  # Default to hold
            df.loc[df['future_return'] > threshold, 'label'] = 1  # Buy signal
            df.loc[df['future_return'] < -threshold, 'label'] = -1  # Sell signal
            
            return df
            
        except Exception as e:
            logger.error(f"Error creating labels: {str(e)}")
            return df
    
    async def train_model(self, symbol: str, timeframe: str = "H1") -> bool:
        """Train the AI model with historical data."""
        try:
            logger.info(f"Training model for {symbol} on {timeframe}")
            
            # Get historical data
            df = await self.get_market_data(symbol, timeframe, count=5000)
            if df is None or len(df) < 100:
                logger.error(f"Insufficient data for training {symbol}")
                return False
            
            # Prepare features and labels
            df = self.prepare_features(df)
            df = self.create_labels(df)
            
            # Remove rows with NaN values
            df = df.dropna()
            
            if len(df) < 100:
                logger.error(f"Insufficient clean data for training {symbol}")
                return False
            
            # Prepare training data
            X = df[self.feature_columns].values
            y = df['label'].values
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"Model trained - Train Score: {train_score:.4f}, Test Score: {test_score:.4f}")
            
            self.is_trained = True
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return False
    
    async def generate_signal(self, symbol: str, timeframe: str = "H1") -> Optional[Dict]:
        """Generate trading signal for a symbol."""
        try:
            if not self.is_trained:
                logger.warning("Model not trained, training now...")
                if not await self.train_model(symbol, timeframe):
                    return None
            
            # Get recent data
            df = await self.get_market_data(symbol, timeframe, count=100)
            if df is None or len(df) < 50:
                return None
            
            # Prepare features
            df = self.prepare_features(df)
            df = df.dropna()
            
            if len(df) == 0:
                return None
            
            # Get latest features
            latest_features = df[self.feature_columns].iloc[-1:].values
            latest_features_scaled = self.scaler.transform(latest_features)
            
            # Make prediction
            prediction = self.model.predict(latest_features_scaled)[0]
            prediction_proba = self.model.predict_proba(latest_features_scaled)[0]
            
            # Get current price data
            current_price = df['close'].iloc[-1]
            atr = df['atr'].iloc[-1] if 'atr' in df.columns else current_price * 0.01
            
            # Generate signal based on prediction
            if prediction == 1:  # Buy signal
                signal_type = "buy"
                confidence = prediction_proba[2] if len(prediction_proba) > 2 else prediction_proba[1]
                entry_price = current_price
                stop_loss = current_price - (2 * atr)
                take_profit = current_price + (3 * atr)
            elif prediction == -1:  # Sell signal
                signal_type = "sell"
                confidence = prediction_proba[0]
                entry_price = current_price
                stop_loss = current_price + (2 * atr)
                take_profit = current_price - (3 * atr)
            else:  # Hold
                return None
            
            # Calculate additional metrics
            risk_reward_ratio = abs(take_profit - entry_price) / abs(entry_price - stop_loss)
            
            signal_data = {
                'symbol': symbol,
                'signal_type': signal_type,
                'confidence_score': float(confidence),
                'entry_price': float(entry_price),
                'stop_loss': float(stop_loss),
                'take_profit': float(take_profit),
                'risk_reward_ratio': float(risk_reward_ratio),
                'timeframe': timeframe,
                'analysis_data': {
                    'prediction_probabilities': prediction_proba.tolist(),
                    'atr': float(atr),
                    'rsi': float(df['rsi'].iloc[-1]) if 'rsi' in df.columns else None,
                    'macd': float(df['macd'].iloc[-1]) if 'macd' in df.columns else None
                }
            }
            
            return signal_data
            
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {str(e)}")
            return None
    
    async def analyze_market_sentiment(self, symbols: List[str]) -> Dict:
        """Analyze overall market sentiment across multiple symbols."""
        try:
            sentiment_data = {
                'bullish_signals': 0,
                'bearish_signals': 0,
                'neutral_signals': 0,
                'average_confidence': 0.0,
                'symbol_analysis': {}
            }
            
            total_confidence = 0
            signal_count = 0
            
            for symbol in symbols:
                signal = await self.generate_signal(symbol)
                if signal:
                    sentiment_data['symbol_analysis'][symbol] = signal
                    
                    if signal['signal_type'] == 'buy':
                        sentiment_data['bullish_signals'] += 1
                    elif signal['signal_type'] == 'sell':
                        sentiment_data['bearish_signals'] += 1
                    else:
                        sentiment_data['neutral_signals'] += 1
                    
                    total_confidence += signal['confidence_score']
                    signal_count += 1
            
            if signal_count > 0:
                sentiment_data['average_confidence'] = total_confidence / signal_count
            
            # Determine overall market sentiment
            total_signals = sentiment_data['bullish_signals'] + sentiment_data['bearish_signals']
            if total_signals > 0:
                bullish_ratio = sentiment_data['bullish_signals'] / total_signals
                if bullish_ratio > 0.6:
                    sentiment_data['overall_sentiment'] = 'bullish'
                elif bullish_ratio < 0.4:
                    sentiment_data['overall_sentiment'] = 'bearish'
                else:
                    sentiment_data['overall_sentiment'] = 'neutral'
            else:
                sentiment_data['overall_sentiment'] = 'neutral'
            
            return sentiment_data
            
        except Exception as e:
            logger.error(f"Error analyzing market sentiment: {str(e)}")
            return {}
    
    async def backtest_strategy(self, symbol: str, timeframe: str = "H1", days: int = 30) -> Dict:
        """Backtest the trading strategy."""
        try:
            # Get historical data
            df = await self.get_market_data(symbol, timeframe, count=days * 24)
            if df is None or len(df) < 100:
                return {}
            
            # Prepare features and labels
            df = self.prepare_features(df)
            df = self.create_labels(df)
            df = df.dropna()
            
            if len(df) < 50:
                return {}
            
            # Simulate trading
            initial_balance = 10000
            balance = initial_balance
            position = None
            trades = []
            
            for i in range(50, len(df)):  # Start after enough data for indicators
                current_data = df.iloc[:i+1]
                
                # Generate signal
                features = current_data[self.feature_columns].iloc[-1:].values
                if self.is_trained:
                    features_scaled = self.scaler.transform(features)
                    prediction = self.model.predict(features_scaled)[0]
                else:
                    continue
                
                current_price = current_data['close'].iloc[-1]
                
                # Execute trades based on signals
                if position is None and prediction != 0:
                    # Open position
                    position = {
                        'type': 'buy' if prediction == 1 else 'sell',
                        'entry_price': current_price,
                        'entry_time': current_data.index[-1],
                        'size': balance * 0.1 / current_price  # Risk 10% per trade
                    }
                
                elif position is not None:
                    # Check exit conditions
                    should_exit = False
                    exit_reason = ""
                    
                    if position['type'] == 'buy' and prediction == -1:
                        should_exit = True
                        exit_reason = "Signal reversal"
                    elif position['type'] == 'sell' and prediction == 1:
                        should_exit = True
                        exit_reason = "Signal reversal"
                    
                    if should_exit:
                        # Close position
                        if position['type'] == 'buy':
                            profit = (current_price - position['entry_price']) * position['size']
                        else:
                            profit = (position['entry_price'] - current_price) * position['size']
                        
                        balance += profit
                        
                        trades.append({
                            'entry_time': position['entry_time'],
                            'exit_time': current_data.index[-1],
                            'type': position['type'],
                            'entry_price': position['entry_price'],
                            'exit_price': current_price,
                            'profit': profit,
                            'exit_reason': exit_reason
                        })
                        
                        position = None
            
            # Calculate performance metrics
            total_return = (balance - initial_balance) / initial_balance * 100
            num_trades = len(trades)
            winning_trades = len([t for t in trades if t['profit'] > 0])
            win_rate = winning_trades / num_trades * 100 if num_trades > 0 else 0
            
            avg_profit = sum([t['profit'] for t in trades]) / num_trades if num_trades > 0 else 0
            
            return {
                'initial_balance': initial_balance,
                'final_balance': balance,
                'total_return_pct': total_return,
                'num_trades': num_trades,
                'winning_trades': winning_trades,
                'win_rate_pct': win_rate,
                'average_profit_per_trade': avg_profit,
                'trades': trades[-10:]  # Return last 10 trades
            }
            
        except Exception as e:
            logger.error(f"Error in backtesting: {str(e)}")
            return {}


# Global AI service instance
ai_service = AITradingService()