"""
FastAPI Backend for AI Trading Platform
Provides real-time data integration, user management, and trading services
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import json
import logging
from datetime import datetime, timedelta
import jwt
import hashlib
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Pydantic Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class TradingSignal(BaseModel):
    id: int
    symbol: str
    signal_type: str
    entry_price: float
    stop_loss: float
    take_profit: float
    confidence: float
    timestamp: datetime
    status: str

class MT5Account(BaseModel):
    id: int
    name: str
    balance: float
    equity: float
    margin: float
    free_margin: float
    profit: float
    currency: str
    leverage: int
    server: str

class TradingBotConfig(BaseModel):
    is_active: bool
    risk_level: str
    max_trades_per_day: int
    stop_loss_percentage: float
    take_profit_percentage: float

class MarketData(BaseModel):
    symbol: str
    bid: float
    ask: float
    spread: float
    timestamp: datetime

# Mock Database (In production, use PostgreSQL/MongoDB)
users_db = {}
signals_db = []
accounts_db = []
bot_configs_db = {}
market_data_db = {}

# Utility Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Background Tasks
async def generate_mock_signals():
    """Generate mock trading signals periodically"""
    import random
    
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"]
    signal_types = ["BUY", "SELL"]
    
    while True:
        try:
            signal = {
                "id": len(signals_db) + 1,
                "symbol": random.choice(symbols),
                "signal_type": random.choice(signal_types),
                "entry_price": round(random.uniform(1.0, 1.5), 4),
                "stop_loss": round(random.uniform(0.9, 1.0), 4),
                "take_profit": round(random.uniform(1.5, 2.0), 4),
                "confidence": round(random.uniform(0.6, 0.95), 2),
                "timestamp": datetime.utcnow(),
                "status": "active"
            }
            
            signals_db.append(signal)
            
            # Keep only last 50 signals
            if len(signals_db) > 50:
                signals_db.pop(0)
                
            logger.info(f"Generated signal: {signal['symbol']} {signal['signal_type']}")
            
        except Exception as e:
            logger.error(f"Error generating signal: {e}")
            
        await asyncio.sleep(30)  # Generate signal every 30 seconds

async def update_market_data():
    """Update mock market data periodically"""
    import random
    
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"]
    
    # Initialize market data
    for symbol in symbols:
        market_data_db[symbol] = {
            "symbol": symbol,
            "bid": round(random.uniform(1.0, 1.5), 4),
            "ask": round(random.uniform(1.0, 1.5), 4),
            "spread": 0.0002,
            "timestamp": datetime.utcnow()
        }
    
    while True:
        try:
            for symbol in symbols:
                # Simulate price movement
                current_bid = market_data_db[symbol]["bid"]
                change = random.uniform(-0.001, 0.001)
                new_bid = round(current_bid + change, 4)
                new_ask = round(new_bid + 0.0002, 4)
                
                market_data_db[symbol].update({
                    "bid": new_bid,
                    "ask": new_ask,
                    "timestamp": datetime.utcnow()
                })
                
        except Exception as e:
            logger.error(f"Error updating market data: {e}")
            
        await asyncio.sleep(1)  # Update every second

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Trading Platform Backend...")
    
    # Initialize mock data
    accounts_db.extend([
        {
            "id": 1,
            "name": "Demo Account 1",
            "balance": 10000.0,
            "equity": 10250.0,
            "margin": 500.0,
            "free_margin": 9750.0,
            "profit": 250.0,
            "currency": "USD",
            "leverage": 100,
            "server": "Demo-Server"
        },
        {
            "id": 2,
            "name": "Live Account 1",
            "balance": 5000.0,
            "equity": 4850.0,
            "margin": 200.0,
            "free_margin": 4650.0,
            "profit": -150.0,
            "currency": "USD",
            "leverage": 50,
            "server": "Live-Server"
        }
    ])
    
    # Start background tasks
    asyncio.create_task(generate_mock_signals())
    asyncio.create_task(update_market_data())
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Trading Platform Backend...")

# FastAPI App
app = FastAPI(
    title="AI Trading Platform API",
    description="Backend API for AI-powered trading platform with real-time data",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """User login endpoint"""
    try:
        email = user_data.email
        password = hash_password(user_data.password)
        
        # Check if user exists (mock authentication)
        if email in users_db and users_db[email]["password"] == password:
            access_token = create_access_token(data={"sub": email})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "email": email,
                    "first_name": users_db[email]["first_name"],
                    "last_name": users_db[email]["last_name"]
                }
            }
        else:
            # For demo purposes, allow any login
            access_token = create_access_token(data={"sub": email})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "email": email,
                    "first_name": "Demo",
                    "last_name": "User"
                }
            }
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """User registration endpoint"""
    try:
        email = user_data.email
        
        if email in users_db:
            raise HTTPException(status_code=400, detail="User already exists")
        
        users_db[email] = {
            "email": email,
            "password": hash_password(user_data.password),
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "created_at": datetime.utcnow()
        }
        
        access_token = create_access_token(data={"sub": email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

# Trading Signals Endpoints
@app.get("/api/signals")
async def get_signals(current_user: str = Depends(verify_token)):
    """Get all trading signals"""
    return {"signals": signals_db}

@app.get("/api/signals/active")
async def get_active_signals(current_user: str = Depends(verify_token)):
    """Get active trading signals"""
    active_signals = [s for s in signals_db if s["status"] == "active"]
    return {"signals": active_signals}

# MT5 Account Endpoints
@app.get("/api/mt5/accounts")
async def get_mt5_accounts(current_user: str = Depends(verify_token)):
    """Get MT5 accounts"""
    return {"accounts": accounts_db}

@app.get("/api/mt5/account/{account_id}")
async def get_mt5_account(account_id: int, current_user: str = Depends(verify_token)):
    """Get specific MT5 account"""
    account = next((acc for acc in accounts_db if acc["id"] == account_id), None)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

# Market Data Endpoints
@app.get("/api/market/data")
async def get_market_data(current_user: str = Depends(verify_token)):
    """Get current market data"""
    return {"market_data": list(market_data_db.values())}

@app.get("/api/market/data/{symbol}")
async def get_symbol_data(symbol: str, current_user: str = Depends(verify_token)):
    """Get market data for specific symbol"""
    if symbol not in market_data_db:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return market_data_db[symbol]

# Trading Bot Endpoints
@app.get("/api/bot/status")
async def get_bot_status(current_user: str = Depends(verify_token)):
    """Get trading bot status"""
    return {
        "is_active": bot_configs_db.get(current_user, {}).get("is_active", False),
        "total_trades": 45,
        "successful_trades": 32,
        "win_rate": 71.1,
        "total_profit": 2350.50,
        "daily_profit": 125.30,
        "risk_level": bot_configs_db.get(current_user, {}).get("risk_level", "medium"),
        "last_signal": datetime.utcnow() - timedelta(minutes=5)
    }

@app.post("/api/bot/config")
async def update_bot_config(config: TradingBotConfig, current_user: str = Depends(verify_token)):
    """Update trading bot configuration"""
    bot_configs_db[current_user] = config.dict()
    return {"message": "Bot configuration updated successfully"}

# Dashboard Endpoints
@app.get("/api/dashboard/overview")
async def get_dashboard_overview(current_user: str = Depends(verify_token)):
    """Get dashboard overview data"""
    return {
        "account_balance": 15000.0,
        "equity": 15250.0,
        "margin": 750.0,
        "free_margin": 14500.0,
        "today_profit": 250.0,
        "open_positions": 3,
        "active_signals": len([s for s in signals_db if s["status"] == "active"]),
        "recent_trades": [
            {
                "symbol": "EURUSD",
                "type": "BUY",
                "profit": 125.50,
                "created_at": datetime.utcnow() - timedelta(hours=2)
            },
            {
                "symbol": "GBPUSD", 
                "type": "SELL",
                "profit": -45.20,
                "created_at": datetime.utcnow() - timedelta(hours=4)
            }
        ]
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time data"""
    await websocket.accept()
    try:
        while True:
            # Send real-time market data
            data = {
                "type": "market_update",
                "data": list(market_data_db.values()),
                "timestamp": datetime.utcnow().isoformat()
            }
            await websocket.send_text(json.dumps(data, default=str))
            await asyncio.sleep(1)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "services": {
            "signals_generator": "running",
            "market_data": "running",
            "database": "connected"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )