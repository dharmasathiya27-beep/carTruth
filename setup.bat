@echo off
REM CarTruth MVP - Quick Start Setup Script for Windows

echo.
echo 🚗 CarTruth MVP - Setup Script (Windows)
echo =====================================
echo.

REM Backend setup
echo 1. Setting up Backend...
cd backend

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.9+
    exit /b 1
)

REM Create virtual environment
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing Python dependencies...
pip install -r requirements.txt -q

echo ✓ Backend setup complete
echo.

REM Frontend setup
echo 2. Setting up Frontend...
cd ..\frontend

REM Check if Node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

REM Install dependencies
echo 📥 Installing Node dependencies...
call npm install -q

echo ✓ Frontend setup complete
echo.

REM Summary
echo 3. Ready to start!
echo.
echo 📝 To run the project:
echo.
echo    Backend (Terminal 1):
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python run.py
echo.
echo    Frontend (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo 🌐 Then open: http://localhost:3000
echo.
echo Happy developing!
