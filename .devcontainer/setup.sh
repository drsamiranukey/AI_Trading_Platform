#!/bin/bash

echo "🚀 Setting up AI Trading Platform in Cloud Environment..."

# Install backend dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies  
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Create startup scripts
echo "📝 Creating startup scripts..."

# Backend startup script
cat > start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting WebSocket Server..."
cd backend
python websocket_server.py
EOF

# Frontend startup script
cat > start_frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting React Development Server..."
cd frontend
npm start
EOF

# Make scripts executable
chmod +x start_backend.sh
chmod +x start_frontend.sh

# Create combined startup script
cat > start_all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting AI Trading Platform..."

# Start backend in background
echo "Starting backend..."
./start_backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
./start_frontend.sh &
FRONTEND_PID=$!

echo "✅ AI Trading Platform is starting up!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 WebSocket: ws://localhost:8765"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x start_all.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick Start Commands:"
echo "  ./start_all.sh     - Start both backend and frontend"
echo "  ./start_backend.sh - Start only WebSocket server"
echo "  ./start_frontend.sh - Start only React app"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  WebSocket: ws://localhost:8765"