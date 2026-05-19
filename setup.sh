#!/bin/bash

# CarTruth MVP - Quick Start Setup Script

echo "🚗 CarTruth MVP - Setup Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend setup
echo -e "${BLUE}1. Setting up Backend...${NC}"
cd backend

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt -q

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Frontend setup
echo -e "${BLUE}2. Setting up Frontend...${NC}"
cd ../frontend

# Check if Node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Install dependencies
echo "📥 Installing Node dependencies..."
npm install -q

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Summary
echo -e "${BLUE}3. Ready to start!${NC}"
echo ""
echo "📝 To run the project:"
echo ""
echo "   Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python run.py"
echo ""
echo "   Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "🌐 Then open: http://localhost:3000"
echo ""
echo -e "${GREEN}Happy developing!${NC}"
