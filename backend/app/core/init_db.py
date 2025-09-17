"""
Database initialization script
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, get_db
from app.models import Base, User, UserRole
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

async def init_db():
    """Initialize database with tables and initial data."""
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
        # Create initial admin user
        await create_initial_admin()
        
        logger.info("Database initialization completed")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

async def create_initial_admin():
    """Create initial admin user if it doesn't exist."""
    async for db in get_db():
        try:
            # Check if admin user already exists
            from sqlalchemy import select
            result = await db.execute(
                select(User).where(User.email == "admin@aitrading.com")
            )
            existing_admin = result.scalar_one_or_none()
            
            if not existing_admin:
                # Create admin user
                admin_user = User(
                    email="admin@aitrading.com",
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                
                db.add(admin_user)
                await db.commit()
                logger.info("Initial admin user created: admin@aitrading.com")
            else:
                logger.info("Admin user already exists")
                
        except Exception as e:
            logger.error(f"Failed to create admin user: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()
            break

async def reset_db():
    """Reset database by dropping and recreating all tables."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database reset completed")
        
        # Recreate initial data
        await create_initial_admin()
        
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())