"""
Main API router for v1 endpoints
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, mt5, signals, trading, subscription, dashboard, admin

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(mt5.router, prefix="/mt5", tags=["mt5"])
api_router.include_router(signals.router, prefix="/signals", tags=["signals"])
api_router.include_router(trading.router, prefix="/trading", tags=["trading"])
api_router.include_router(subscription.router, prefix="/subscription", tags=["subscription"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])