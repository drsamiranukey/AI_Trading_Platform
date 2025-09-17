#!/bin/bash

# AI Trading Platform - Gitpod Startup Script
# This script ensures proper initialization of the trading platform

set -e  # Exit on any error

echo "🚀 AI Trading Platform - Gitpod Startup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in Gitpod
if [ -z "$GITPOD_WORKSPACE_ID" ]; then
    print_warning "Not running in Gitpod environment"
else
    print_info "Gitpod Workspace ID: $GITPOD_WORKSPACE_ID"
    print_info "Gitpod Cluster: $GITPOD_WORKSPACE_CLUSTER_HOST"
fi

# Set up environment
export PYTHONPATH="/workspace/AI_Trading_Platform/backend"
export NODE_ENV="development"

if [ -n "$GITPOD_WORKSPACE_ID" ]; then
    export REACT_APP_WS_URL="wss://8765-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
    print_info "WebSocket URL: $REACT_APP_WS_URL"
fi

# Check system requirements
print_info "Checking system requirements..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python: $PYTHON_VERSION"
else
    print_error "Python 3 not found"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Navigate to project root
cd /workspace/AI_Trading_Platform || {
    print_error "Could not find AI_Trading_Platform directory"
    exit 1
}

print_status "Project directory: $(pwd)"

# Backend setup
print_info "Setting up backend..."
cd backend

# Create logs directory
mkdir -p logs
print_status "Created logs directory"

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    print_info "Installing Python dependencies..."
    pip3 install -r requirements.txt
    print_status "Python dependencies installed"
else
    print_error "requirements.txt not found"
    exit 1
fi

# Test Python imports
print_info "Testing Python imports..."
python3 -c "
import sys
sys.path.append('/workspace/AI_Trading_Platform/backend')
try:
    import websocket_server
    print('✅ WebSocket server module imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    sys.exit(1)
"

cd ..

# Frontend setup
print_info "Setting up frontend..."
cd frontend

# Install Node.js dependencies
if [ -f "package.json" ]; then
    print_info "Installing Node.js dependencies..."
    npm install
    print_status "Node.js dependencies installed"
else
    print_error "package.json not found"
    exit 1
fi

cd ..

# Create startup URLs info
print_info "Creating startup information..."

cat > gitpod_urls.txt << EOF
🌐 AI Trading Platform - Gitpod URLs
=====================================

Frontend (React):
https://3000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}

WebSocket Server:
wss://8765-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}

FastAPI Backend (if needed):
https://8000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}

📝 Notes:
- Frontend will open automatically
- WebSocket connects automatically
- Check terminals for server status
- Use 'gp ports list' to see all ports

🔧 Useful Commands:
- Restart backend: cd backend && python3 websocket_server.py
- Restart frontend: cd frontend && npm start
- View logs: cd backend && python3 view_logs.py
- Test WebSocket: cd backend && python3 simple_websocket_test.py

EOF

print_status "Setup complete!"
print_info "URLs saved to gitpod_urls.txt"

# Display final information
echo ""
echo "🎉 AI Trading Platform Setup Complete!"
echo "======================================"
echo ""
print_info "Frontend URL: https://3000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
print_info "WebSocket URL: wss://8765-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
echo ""
print_status "Ready to start trading! 📈"
echo ""
print_info "Next steps:"
echo "1. Backend will start automatically in terminal 2"
echo "2. Frontend will start automatically in terminal 3"
echo "3. Platform will open in new browser tab"
echo "4. Check terminals for any errors"
echo ""
print_info "Happy trading! 🚀"