#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Cvety.kz Development Environment${NC}"
echo "============================================="

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}📦 Creating Python virtual environment...${NC}"
    cd backend && python3 -m venv venv && cd ..
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Check if backend dependencies are installed
if [ ! -f "backend/venv/bin/uvicorn" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend && source venv/bin/activate && pip install -r requirements.txt && cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Start backend
echo -e "${GREEN}✅ Starting backend server on http://localhost:8000${NC}"
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Give backend time to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Start frontend
echo -e "${GREEN}✅ Starting frontend server on http://localhost:5173${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo -e "${GREEN}✅ Development environment is running!${NC}"
echo -e "${BLUE}📝 Logs from both servers will appear below${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo "============================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID