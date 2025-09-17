#!/usr/bin/env python3
"""
Simple WebSocket server for testing real-time signals
This is a minimal version to test WebSocket connectivity
"""

import asyncio
import json
import logging
import time
from datetime import datetime
import random

# Try to import websockets, provide fallback if not available
try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    print("❌ websockets library not found. Please install it with: pip install websockets")
    WEBSOCKETS_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleSignalServer:
    def __init__(self):
        self.connected_clients = set()
        self.running = False
        
        # Sample trading symbols
        self.symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD']
        
    async def register_client(self, websocket, path):
        """Register a new client"""
        self.connected_clients.add(websocket)
        client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"✅ Client connected: {client_info} (Total: {len(self.connected_clients)})")
        
        try:
            # Send welcome message
            welcome_msg = {
                "type": "connection",
                "status": "connected",
                "message": "Welcome to Real-Time Signals!",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(welcome_msg))
            
            # Keep connection alive and handle messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    logger.info(f"📨 Received from {client_info}: {data}")
                    
                    # Echo back the message
                    response = {
                        "type": "echo",
                        "original": data,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(response))
                    
                except json.JSONDecodeError:
                    logger.error(f"❌ Invalid JSON from {client_info}: {message}")
                except Exception as e:
                    logger.error(f"❌ Error handling message from {client_info}: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client disconnected: {client_info}")
        except Exception as e:
            logger.error(f"❌ Connection error with {client_info}: {e}")
        finally:
            self.connected_clients.discard(websocket)
            logger.info(f"🔄 Client removed: {client_info} (Remaining: {len(self.connected_clients)})")
    
    def generate_sample_signal(self):
        """Generate a sample trading signal"""
        symbol = random.choice(self.symbols)
        signal_type = random.choice(['BUY', 'SELL'])
        base_price = random.uniform(1.0, 2000.0)
        
        if signal_type == 'BUY':
            entry_price = base_price
            stop_loss = base_price * 0.98
            take_profit = base_price * 1.02
        else:
            entry_price = base_price
            stop_loss = base_price * 1.02
            take_profit = base_price * 0.98
            
        return {
            "type": "signal",
            "data": {
                "symbol": symbol,
                "signal_type": signal_type,
                "entry_price": round(entry_price, 5),
                "stop_loss": round(stop_loss, 5),
                "take_profit": round(take_profit, 5),
                "confidence": round(random.uniform(0.6, 0.95), 2),
                "timestamp": datetime.now().isoformat(),
                "source": "AI_Trading_Bot"
            }
        }
    
    async def broadcast_signals(self):
        """Broadcast trading signals to all connected clients"""
        while self.running:
            try:
                if self.connected_clients:
                    signal = self.generate_sample_signal()
                    message = json.dumps(signal)
                    
                    # Send to all connected clients
                    disconnected_clients = set()
                    for client in self.connected_clients.copy():
                        try:
                            await client.send(message)
                        except websockets.exceptions.ConnectionClosed:
                            disconnected_clients.add(client)
                        except Exception as e:
                            logger.error(f"❌ Error sending signal to client: {e}")
                            disconnected_clients.add(client)
                    
                    # Remove disconnected clients
                    for client in disconnected_clients:
                        self.connected_clients.discard(client)
                    
                    if disconnected_clients:
                        logger.info(f"🔄 Removed {len(disconnected_clients)} disconnected clients")
                    
                    logger.info(f"📡 Signal broadcasted to {len(self.connected_clients)} clients: {signal['data']['symbol']} {signal['data']['signal_type']}")
                
                # Wait before next signal (15-30 seconds)
                await asyncio.sleep(random.uniform(15, 30))
                
            except Exception as e:
                logger.error(f"❌ Error in signal broadcasting: {e}")
                await asyncio.sleep(5)
    
    async def start_server(self, host='localhost', port=8765):
        """Start the WebSocket server"""
        if not WEBSOCKETS_AVAILABLE:
            print("❌ Cannot start server: websockets library not available")
            return
            
        self.running = True
        
        try:
            # Start signal broadcasting task
            signal_task = asyncio.create_task(self.broadcast_signals())
            
            # Start WebSocket server
            logger.info(f"🚀 Starting WebSocket server on ws://{host}:{port}")
            
            async with websockets.serve(self.register_client, host, port):
                logger.info(f"✅ Server running on ws://{host}:{port}")
                logger.info("📡 Broadcasting signals every 15-30 seconds")
                logger.info("🔌 Waiting for client connections...")
                
                # Keep server running
                await asyncio.Future()  # Run forever
                
        except Exception as e:
            logger.error(f"❌ Server error: {e}")
            raise
        finally:
            self.running = False
            if 'signal_task' in locals():
                signal_task.cancel()

def main():
    """Main function"""
    if not WEBSOCKETS_AVAILABLE:
        print("\n" + "="*50)
        print("❌ WEBSOCKETS LIBRARY NOT FOUND")
        print("="*50)
        print("To fix this issue, please install the websockets library:")
        print("pip install websockets")
        print("\nOr if you're using conda:")
        print("conda install -c conda-forge websockets")
        print("="*50)
        return
    
    server = SimpleSignalServer()
    
    try:
        print("\n" + "="*50)
        print("🚀 SIMPLE WEBSOCKET SIGNAL SERVER")
        print("="*50)
        print("📡 Server will broadcast trading signals every 15-30 seconds")
        print("🔌 Connect using: ws://localhost:8765")
        print("⏹️  Press Ctrl+C to stop")
        print("="*50 + "\n")
        
        asyncio.run(server.start_server())
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        print("\nCommon issues:")
        print("1. Port 8765 might be in use - try a different port")
        print("2. Firewall might be blocking the connection")
        print("3. Missing dependencies - check requirements.txt")
    finally:
        print("🔄 Server shutdown complete")

if __name__ == "__main__":
    main()