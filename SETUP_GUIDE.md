# 🚀 AI Trading Platform Setup Guide

## 🔍 Connection Problem Diagnosis

The connection issues between backend and frontend are caused by **missing runtime environments**:

- ❌ **Python** is not installed or not in PATH
- ❌ **Node.js** is not installed or not in PATH
- ❌ **pip** (Python package manager) is not available
- ❌ **npm** (Node.js package manager) is not available

## 📋 Prerequisites Installation

### 1. Install Python (Required for Backend)

#### Option A: Official Python Installer
1. Download Python 3.9+ from [python.org](https://www.python.org/downloads/)
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```bash
   python --version
   pip --version
   ```

#### Option B: Anaconda/Miniconda (Recommended)
1. Download from [anaconda.com](https://www.anaconda.com/products/distribution)
2. Install with default settings
3. Open "Anaconda Prompt" or restart terminal
4. Verify installation:
   ```bash
   python --version
   conda --version
   ```

### 2. Install Node.js (Required for Frontend)

#### Option A: Official Node.js Installer
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Install with default settings
3. Restart terminal/PowerShell
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Option B: Using Chocolatey (Windows Package Manager)
1. Install Chocolatey first: [chocolatey.org](https://chocolatey.org/install)
2. Run as Administrator:
   ```bash
   choco install nodejs
   ```

## 🛠️ Project Setup Instructions

### Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd "d:\Dr Samiran Ai Projects\AI_Trading_Platform\backend"
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the WebSocket server:**
   ```bash
   python websocket_server.py
   ```

### Step 2: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd "d:\Dr Samiran Ai Projects\AI_Trading_Platform\frontend"
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## 🔧 Alternative Solutions

### If Python/Node.js Installation Fails:

#### Option 1: Use Docker (Containerized Solution)
```bash
# In project root directory
docker-compose up --build
```

#### Option 2: Use Portable Python
1. Download WinPython from [winpython.github.io](https://winpython.github.io/)
2. Extract to a folder
3. Use the included Python executable

#### Option 3: Use Online Development Environment
- GitHub Codespaces
- Gitpod
- Repl.it

## 🚨 Common Issues & Solutions

### Issue 1: "Python/Node not recognized"
**Solution**: Add to Windows PATH environment variable
1. Search "Environment Variables" in Windows
2. Edit "Path" variable
3. Add Python/Node installation directories

### Issue 2: Permission Errors
**Solution**: Run terminal as Administrator

### Issue 3: Port Already in Use
**Solution**: Change ports in configuration:
- Backend: Edit `websocket_server.py` (line ~354)
- Frontend: Set `PORT=3001` environment variable

### Issue 4: Firewall Blocking Connections
**Solution**: Allow Python/Node through Windows Firewall

## 📊 Testing Connection

### Quick Test Commands:

1. **Test Python:**
   ```bash
   python -c "print('Python is working!')"
   ```

2. **Test Node.js:**
   ```bash
   node -e "console.log('Node.js is working!')"
   ```

3. **Test WebSocket Connection:**
   - Open `websocket_client_test.html` in browser
   - Try connecting to `ws://localhost:8765`

## 🎯 Expected Results

After successful setup:
- ✅ Backend WebSocket server running on `ws://localhost:8765`
- ✅ Frontend React app running on `http://localhost:3000`
- ✅ Real-time signal communication between frontend and backend
- ✅ Live trading signals displayed in the dashboard

## 📞 Need Help?

If you continue experiencing issues:
1. Check the specific error messages in terminal
2. Verify all prerequisites are installed correctly
3. Try the alternative solutions above
4. Use the diagnostic tools provided (`websocket_client_test.html`)

## 🔄 Quick Start Script

Save this as `setup.bat` for automated setup:

```batch
@echo off
echo Installing AI Trading Platform...

echo Checking Python...
python --version
if %errorlevel% neq 0 (
    echo Python not found! Please install Python first.
    pause
    exit /b 1
)

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo Setting up backend...
cd backend
pip install -r requirements.txt
start "Backend" python websocket_server.py

echo Setting up frontend...
cd ../frontend
npm install
start "Frontend" npm start

echo Setup complete! Check the opened windows.
pause
```

---

**Note**: This setup guide addresses the root cause of your connection problems. Once Python and Node.js are properly installed, the backend and frontend will be able to communicate successfully.