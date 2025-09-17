# AI Trading Platform - Gitpod Startup Script (PowerShell)
# This script initializes the development environment

Write-Host "🔧 Setting up AI Trading Platform for Gitpod..." -ForegroundColor Cyan

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to log with timestamp
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Create logs directory
Write-Log "📁 Creating logs directory..." "Yellow"
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    Write-Log "✅ Logs directory created" "Green"
} else {
    Write-Log "✅ Logs directory already exists" "Green"
}

# Check system requirements
Write-Log "🔍 Checking system requirements..." "Yellow"

# Check Python
if (Test-Command "python") {
    $pythonVersion = python --version 2>&1
    Write-Log "✅ Python found: $pythonVersion" "Green"
} elseif (Test-Command "python3") {
    $pythonVersion = python3 --version 2>&1
    Write-Log "✅ Python3 found: $pythonVersion" "Green"
} else {
    Write-Log "❌ Python not found! Please install Python 3.8+" "Red"
    exit 1
}

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version 2>&1
    Write-Log "✅ Node.js found: $nodeVersion" "Green"
} else {
    Write-Log "❌ Node.js not found! Please install Node.js 16+" "Red"
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version 2>&1
    Write-Log "✅ npm found: $npmVersion" "Green"
} else {
    Write-Log "❌ npm not found! Please install npm" "Red"
    exit 1
}

# Set environment variables for development
Write-Log "🌍 Setting up environment variables..." "Yellow"
$env:NODE_ENV = "development"
$env:PYTHONPATH = "$PWD/backend"
$env:FLASK_ENV = "development"
Write-Log "✅ Environment variables set" "Green"

# Backend setup
Write-Log "🐍 Setting up Python backend..." "Yellow"
if (Test-Path "backend/requirements.txt") {
    Set-Location "backend"
    
    # Install Python dependencies
    Write-Log "📦 Installing Python dependencies..." "Yellow"
    if (Test-Command "python") {
        python -m pip install -r requirements.txt 2>&1 | Out-Null
    } else {
        python3 -m pip install -r requirements.txt 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Python dependencies installed successfully" "Green"
    } else {
        Write-Log "⚠️ Some Python dependencies may have failed to install" "Yellow"
    }
    
    # Test Python imports
    Write-Log "🧪 Testing Python imports..." "Yellow"
    $testScript = @"
try:
    import asyncio
    import websockets
    import json
    import logging
    print("✅ Core Python modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
"@
    
    $testScript | python
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Python environment ready" "Green"
    } else {
        Write-Log "⚠️ Python environment may have issues" "Yellow"
    }
    
    Set-Location ".."
} else {
    Write-Log "⚠️ Backend requirements.txt not found" "Yellow"
}

# Frontend setup
Write-Log "⚛️ Setting up React frontend..." "Yellow"
if (Test-Path "frontend/package.json") {
    Set-Location "frontend"
    
    # Install Node.js dependencies
    Write-Log "📦 Installing Node.js dependencies..." "Yellow"
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Node.js dependencies installed successfully" "Green"
    } else {
        Write-Log "⚠️ Some Node.js dependencies may have failed to install" "Yellow"
    }
    
    Set-Location ".."
} else {
    Write-Log "⚠️ Frontend package.json not found" "Yellow"
}

# Generate URLs file for reference
Write-Log "🔗 Generating access URLs..." "Yellow"
$urlsContent = @"
# AI Trading Platform - Access URLs

## Development URLs (Local)
Frontend: http://localhost:3000
WebSocket: ws://localhost:8765
API Backend: http://localhost:8000

## Gitpod URLs (when running in Gitpod)
Frontend: https://3000-[workspace-id].[cluster].gitpod.io
WebSocket: wss://8765-[workspace-id].[cluster].gitpod.io
API Backend: https://8000-[workspace-id].[cluster].gitpod.io

## Useful Commands
# Start WebSocket server
cd backend && python websocket_server.py

# Start React frontend
cd frontend && npm start

# View logs
cd backend && python view_logs.py

# Test WebSocket connection
cd backend && python simple_websocket_test.py

## Environment Files
- .env.gitpod (main environment)
- frontend/.env.gitpod (frontend specific)

Generated at: $(Get-Date)
"@

$urlsContent | Out-File -FilePath "gitpod_urls.txt" -Encoding UTF8
Write-Log "✅ URLs file created: gitpod_urls.txt" "Green"

# Final status
Write-Log "🎉 Setup completed successfully!" "Green"
Write-Log "📋 Next steps:" "Cyan"
Write-Log "   1. Start WebSocket server: cd backend && python websocket_server.py" "White"
Write-Log "   2. Start frontend: cd frontend && npm start" "White"
Write-Log "   3. Open browser to http://localhost:3000" "White"
Write-Log "   4. Check gitpod_urls.txt for all access URLs" "White"

Write-Host "`n✨ AI Trading Platform is ready for development! ✨" -ForegroundColor Green