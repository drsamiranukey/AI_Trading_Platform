import asyncio
import json
import logging
import websockets
from datetime import datetime, timedelta
import random
import numpy as np
from typing import Dict, List, Set
import MetaTrader5 as mt5

# Import the real-time signal service
from app.services.realtime_signal_service import realtime_signal_service

# Import logging configuration
from logging_config import setup_logging

# Configure comprehensive logging
setup_logging(log_level=logging.INFO)
logger = logging.getLogger('websocket_server')

class MarketDataStreamer:
    def __init__(self):
        self.connected_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.subscriptions: Dict[str, Set[websockets.WebSocketServerProtocol]] = {}
        self.mt5_connected = False
        self.running = False
        
        # Currency pairs to stream
        self.symbols = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 
            'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP',
            'XAUUSD', 'BTCUSD', 'ETHUSD'  # Added Gold and Crypto
        ]
        
        # Initialize MT5 connection
        self.init_mt5()
        
    def init_mt5(self):
        """Initialize MetaTrader 5 connection"""
        try:
            if not mt5.initialize():
                logger.warning("MT5 initialization failed, using mock data")
                self.mt5_connected = False
            else:
                logger.info("MT5 connected successfully")
                self.mt5_connected = True
        except Exception as e:
            logger.error(f"MT5 connection error: {e}")
            self.mt5_connected = False
    
    async def register_client(self, websocket, path):
        """Register a new WebSocket client"""
        self.connected_clients.add(websocket)
        
        # Add client to real-time signal service
        realtime_signal_service.add_subscriber(websocket)
        
        logger.info(f"🔗 Client connected. Total clients: {len(self.connected_clients)}")
        
        try:
            # Send initial data to the client
            await self.send_initial_data(websocket)
            
            # Handle incoming messages
            async for message in websocket:
                await self.handle_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("Client disconnected")
        except Exception as e:
            logger.error(f"Client error: {e}")
        finally:
            await self.unregister_client(websocket)
    
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        self.connected_clients.discard(websocket)
        
        # Remove client from real-time signal service
        realtime_signal_service.remove_subscriber(websocket)
        
        # Remove from all symbol subscriptions
        for symbol_clients in self.subscriptions.values():
            symbol_clients.discard(websocket)
            
        logger.info(f"🔌 Client disconnected. Total clients: {len(self.connected_clients)}")
    
    async def handle_message(self, websocket, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            action = data.get('action')
            
            if action == 'subscribe':
                symbol = data.get('symbol')
                await self.subscribe_symbol(websocket, symbol)
                
            elif action == 'unsubscribe':
                symbol = data.get('symbol')
                await self.unsubscribe_symbol(websocket, symbol)
                
            elif action == 'get_signals':
                await self.send_trading_signals(websocket)
                
            elif action == 'get_portfolio':
                await self.send_portfolio_data(websocket)
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON message received")
        except Exception as e:
            logger.error(f"Message handling error: {e}")
    
    async def subscribe_symbol(self, websocket, symbol):
        """Subscribe client to symbol updates"""
        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = set()
        
        self.subscriptions[symbol].add(websocket)
        
        # Send current price
        price_data = await self.get_symbol_price(symbol)
        await websocket.send(json.dumps({
            'type': 'price_update',
            'symbol': symbol,
            'data': price_data
        }))
        
        logger.info(f"Client subscribed to {symbol}")
    
    async def unsubscribe_symbol(self, websocket, symbol):
        """Unsubscribe client from symbol updates"""
        if symbol in self.subscriptions:
            self.subscriptions[symbol].discard(websocket)
            logger.info(f"Client unsubscribed from {symbol}")
    
    async def send_initial_data(self, websocket):
        """Send initial market data to new client"""
        # Send initial data to new client
        try:
            # Send market overview
            market_data = await self.get_market_overview()
            await websocket.send(json.dumps({
                'type': 'market_overview',
                'data': market_data
            }))
            
            # Send current active signals from real-time service
            active_signals = realtime_signal_service.get_active_signals()
            if active_signals:
                await websocket.send(json.dumps({
                    'type': 'active_signals',
                    'data': active_signals
                }))
            
            # Send signal statistics
            stats = realtime_signal_service.get_signal_statistics()
            await websocket.send(json.dumps({
                'type': 'signal_statistics',
                'data': stats
            }))
            
            # Send portfolio data
            await self.send_portfolio_data(websocket)
            
        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
    
    async def get_symbol_price(self, symbol):
        """Get current price for a symbol"""
        if self.mt5_connected:
            try:
                tick = mt5.symbol_info_tick(symbol)
                if tick:
                    return {
                        'bid': tick.bid,
                        'ask': tick.ask,
                        'spread': tick.ask - tick.bid,
                        'timestamp': datetime.now().isoformat(),
                        'volume': tick.volume if hasattr(tick, 'volume') else 0
                    }
            except Exception as e:
                logger.error(f"MT5 price fetch error for {symbol}: {e}")
        
        # Fallback to mock data
        return self.generate_mock_price(symbol)
    
    def generate_mock_price(self, symbol):
        """Generate mock price data"""
        base_prices = {
            'EURUSD': 1.0850, 'GBPUSD': 1.2650, 'USDJPY': 149.50,
            'USDCHF': 0.8750, 'AUDUSD': 0.6550, 'USDCAD': 1.3650,
            'NZDUSD': 0.6150, 'EURJPY': 162.25, 'GBPJPY': 189.15,
            'EURGBP': 0.8580
        }
        
        base_price = base_prices.get(symbol, 1.0000)
        spread = 0.0002 + random.uniform(0, 0.0003)
        
        # Add some realistic price movement
        change = random.uniform(-0.001, 0.001)
        bid = base_price + change
        ask = bid + spread
        
        return {
            'bid': round(bid, 5),
            'ask': round(ask, 5),
            'spread': round(spread, 5),
            'timestamp': datetime.now().isoformat(),
            'volume': random.randint(100, 1000)
        }
    
    async def get_market_overview(self):
        """Get market overview data"""
        market_data = []
        
        for symbol in self.symbols:
            price_data = await self.get_symbol_price(symbol)
            
            # Calculate daily change (mock)
            daily_change = random.uniform(-0.5, 0.5)
            daily_change_pct = random.uniform(-1.2, 1.2)
            
            market_data.append({
                'symbol': symbol,
                'price': price_data['bid'],
                'change': daily_change,
                'change_percent': daily_change_pct,
                'volume': price_data['volume'],
                'high': price_data['bid'] + random.uniform(0.001, 0.005),
                'low': price_data['bid'] - random.uniform(0.001, 0.005),
                'timestamp': price_data['timestamp']
            })
        
        return market_data
    
    async def send_trading_signals(self, websocket):
        """Send AI trading signals"""
        signals = []
        
        for _ in range(random.randint(2, 5)):
            symbol = random.choice(self.symbols)
            signal_type = random.choice(['BUY', 'SELL'])
            confidence = random.uniform(0.65, 0.95)
            
            signals.append({
                'id': f"signal_{datetime.now().timestamp()}",
                'symbol': symbol,
                'type': signal_type,
                'confidence': round(confidence, 2),
                'entry_price': (await self.get_symbol_price(symbol))['bid'],
                'stop_loss': random.uniform(0.001, 0.003),
                'take_profit': random.uniform(0.002, 0.006),
                'timestamp': datetime.now().isoformat(),
                'reason': f"AI model detected {signal_type.lower()} opportunity",
                'risk_level': 'medium' if confidence > 0.8 else 'low'
            })
        
        await websocket.send(json.dumps({
            'type': 'trading_signals',
            'data': signals
        }))
    
    async def send_portfolio_data(self, websocket):
        """Send portfolio performance data"""
        portfolio_data = {
            'total_balance': 50000 + random.uniform(-5000, 10000),
            'equity': 48500 + random.uniform(-3000, 8000),
            'margin': random.uniform(1000, 5000),
            'free_margin': random.uniform(40000, 45000),
            'profit_loss': random.uniform(-2000, 3000),
            'daily_pnl': random.uniform(-500, 800),
            'open_positions': random.randint(3, 8),
            'win_rate': random.uniform(0.65, 0.85),
            'timestamp': datetime.now().isoformat()
        }
        
        await websocket.send(json.dumps({
            'type': 'portfolio_update',
            'data': portfolio_data
        }))
    
    async def broadcast_price_updates(self):
        """Broadcast price updates to subscribed clients"""
        while self.running:
            try:
                for symbol, clients in self.subscriptions.items():
                    if clients:  # Only if there are subscribed clients
                        price_data = await self.get_symbol_price(symbol)
                        message = json.dumps({
                            'type': 'price_update',
                            'symbol': symbol,
                            'data': price_data
                        })
                        
                        # Send to all subscribed clients
                        disconnected_clients = set()
                        for client in clients:
                            try:
                                await client.send(message)
                            except websockets.exceptions.ConnectionClosed:
                                disconnected_clients.add(client)
                            except Exception as e:
                                logger.error(f"Error sending to client: {e}")
                                disconnected_clients.add(client)
                        
                        # Remove disconnected clients
                        for client in disconnected_clients:
                            clients.discard(client)
                
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                await asyncio.sleep(5)
    
    async def start_server(self, host='localhost', port=8765):
        """Start the WebSocket server"""
        self.running = True
        
        # Start the real-time signal service
        await realtime_signal_service.start_service()
        logger.info("🚀 Real-time signal service started")
        
        # Start background tasks
        price_task = asyncio.create_task(self.broadcast_price_updates())
        logger.info("📊 Price update loop started")
        
        # The signal broadcasting is now handled by the realtime_signal_service
        logger.info("📡 Live signal broadcasting enabled")
        
        logger.info(f"Starting WebSocket server on {host}:{port}")
        
        async with websockets.serve(self.register_client, host, port):
            logger.info("WebSocket server started successfully")
            await asyncio.Future()  # Run forever

def main():
    """Main function to start the WebSocket server"""
    streamer = MarketDataStreamer()
    
    try:
        asyncio.run(streamer.start_server())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        if streamer.mt5_connected:
            mt5.shutdown()
        logger.info("Server shutdown complete")

if __name__ == "__main__":
    import os
    
    # Get host and port from environment variables (for cloud deployment)
    host = os.getenv("WS_HOST", "localhost")
    port = int(os.getenv("PORT", os.getenv("WS_PORT", 8765)))
    
    # Start the WebSocket server
    streamer = MarketDataStreamer()
    
    print(f"🚀 WebSocket server starting on ws://{host}:{port}")
    print("📊 Market data streaming enabled")
    print("🔄 MT5 integration ready (mock mode)")
    print("Press Ctrl+C to stop the server")
    
    try:
        asyncio.run(streamer.start_server(host, port))
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
    finally:
        if streamer.mt5_connected:
            mt5.shutdown()
        print("Server shutdown complete")