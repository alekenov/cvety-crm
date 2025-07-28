# Use Python base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY backend/requirements.txt ./backend/

# Install dependencies
RUN npm ci
RUN pip install -r backend/requirements.txt

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE $PORT

# Start command
CMD cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT