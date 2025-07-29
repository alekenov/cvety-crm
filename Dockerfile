# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy frontend source
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

# Build frontend
RUN npm run build

# Final stage - use slim image
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy entrypoint and other files
COPY docker-entrypoint.sh ./
COPY components.json ./

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Expose port
EXPOSE ${PORT}

# Use entrypoint for proper initialization
ENTRYPOINT ["./docker-entrypoint.sh"]