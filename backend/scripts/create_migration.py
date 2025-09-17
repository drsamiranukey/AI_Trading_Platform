#!/usr/bin/env python3
"""
Script to create Alembic migrations
"""
import sys
import os
import subprocess

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def create_migration(message=None):
    """Create a new Alembic migration."""
    if not message:
        message = input("Enter migration message: ").strip()
        if not message:
            print("Migration message is required!")
            return False
    
    try:
        # Change to the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        os.chdir(backend_dir)
        
        # Run alembic revision command
        cmd = ["alembic", "revision", "--autogenerate", "-m", message]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Migration created successfully: {message}")
            print(result.stdout)
            return True
        else:
            print(f"Failed to create migration: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error creating migration: {e}")
        return False

def upgrade_db():
    """Upgrade database to the latest migration."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        os.chdir(backend_dir)
        
        cmd = ["alembic", "upgrade", "head"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Database upgraded successfully!")
            print(result.stdout)
            return True
        else:
            print(f"Failed to upgrade database: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error upgrading database: {e}")
        return False

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python create_migration.py create [message]")
        print("  python create_migration.py upgrade")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else None
        create_migration(message)
    elif command == "upgrade":
        upgrade_db()
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()