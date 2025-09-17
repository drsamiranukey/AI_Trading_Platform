#!/usr/bin/env python3
"""
Standalone database initialization script
"""
import sys
import os
import asyncio

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.init_db import init_db, reset_db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    """Main function to initialize the database."""
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        print("Resetting database...")
        await reset_db()
        print("Database reset completed!")
    else:
        print("Initializing database...")
        await init_db()
        print("Database initialization completed!")

if __name__ == "__main__":
    asyncio.run(main())