#!/usr/bin/env python3
"""
Simple WebSocket Test Server
No external dependencies required - uses only Python standard library
"""

import asyncio
import websockets
import json
import time
import threading
from datetime import datetime

class SimpleWebSocketServer:
    def __init__(self, host='localhost', port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.running = False
        
    async def register_client(self, websocket):
        """Register a new client"""
        self.clients.add(websocket)
        print(f"✅ Client connected. Total clients: {len(self.clients)}")
        
        # Send welcome message
        welcome_msg = {
            "type": "connection",
            "status": "connected",
            "message": "Welcome to Simple WebSocket Server",
            "timestamp": datetime.now().isoformat(),
            "server_info": {
                "host": self.host,
                "port": self.port,
                "total_clients": len(self.clients)
            }
        }
        await websocket.send(json.dumps(welcome_msg))
        
    async def unregister_client(self, websocket):
        """Unregister a client"""
        self.clients.discard(websocket)
        print(f"❌ Client disconnected. Total clients: {len(self.clients)}")
        
    async def handle_client(self, websocket, path):
        """Handle client connection"""
        try:
            await self.register_client(websocket)
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    print(f"📨 Received: {data}")
                    
                    # Echo the message back to all clients
                    response = {
                        "type": "echo",
                        "original_message": data,
                        "timestamp": datetime.now().isoformat(),
                        "from_server": True
                    }
                    
                    # Broadcast to all clients
                    if self.clients:
                        await asyncio.gather(
                            *[client.send(json.dumps(response)) for client in self.clients],
                            return_exceptions=True
                        )
                        
                except json.JSONDecodeError:
                    error_msg = {
                        "type": "error",
                        "message": "Invalid JSON format",
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(error_msg))
                    
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Client connection closed")
        except Exception as e:
            print(f"❌ Error handling client: {e}")
        finally:
            await self.unregister_client(websocket)
            
    async def broadcast_test_signals(self):
        """Send test signals to all connected clients"""
        counter = 0
        
        while self.running:
            if self.clients:
                counter += 1
                test_signal = {
                    "type": "test_signal",
                    "signal_id": counter,
                    "symbol": "EURUSD",
                    "action": "BUY" if counter % 2 == 0 else "SELL",
                    "price": round(1.0500 + (counter % 100) * 0.0001, 4),
                    "confidence": round(0.7 + (counter % 30) * 0.01, 2),
                    "timestamp": datetime.now().isoformat(),
                    "test_mode": True
                }
                
                try:
                    # Send to all clients
                    await asyncio.gather(
                        *[client.send(json.dumps(test_signal)) for client in self.clients],
                        return_exceptions=True
                    )
                    print(f"📡 Broadcasted test signal #{counter} to {len(self.clients)} clients")
                except Exception as e:
                    print(f"❌ Error broadcasting: {e}")
                    
            await asyncio.sleep(3)  # Send signal every 3 seconds
            
    async def start_server(self):
        """Start the WebSocket server"""
        self.running = True
        
        print(f"🚀 Starting Simple WebSocket Server...")
        print(f"📍 Host: {self.host}")
        print(f"🔌 Port: {self.port}")
        print(f"🌐 WebSocket URL: ws://{self.host}:{self.port}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        try:
            # Start the server and signal broadcaster concurrently
            server = await websockets.serve(self.handle_client, self.host, self.port)
            print(f"✅ WebSocket server is running on ws://{self.host}:{self.port}")
            print("📱 Waiting for client connections...")
            print("🛑 Press Ctrl+C to stop the server")
            
            # Start broadcasting test signals
            signal_task = asyncio.create_task(self.broadcast_test_signals())
            
            # Keep the server running
            await server.wait_closed()
            
        except OSError as e:
            if e.errno == 10048:  # Port already in use
                print(f"❌ Port {self.port} is already in use!")
                print(f"💡 Try a different port or stop the existing server")
                return False
            else:
                print(f"❌ OS Error: {e}")
                return False
        except Exception as e:
            print(f"❌ Server error: {e}")
            return False
        finally:
            self.running = False
            
        return True

def main():
    """Main function to run the server"""
    print("🔧 Simple WebSocket Test Server")
    print("=" * 40)
    
    # Try different ports if the default is busy
    ports_to_try = [8765, 8766, 8767, 8768, 9000]
    
    for port in ports_to_try:
        print(f"\n🔍 Trying port {port}...")
        server = SimpleWebSocketServer(port=port)
        
        try:
            asyncio.run(server.start_server())
            break
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped by user")
            break
        except Exception as e:
            print(f"❌ Failed to start on port {port}: {e}")
            continue
    else:
        print("❌ Could not start server on any available port")

if __name__ == "__main__":
    main()