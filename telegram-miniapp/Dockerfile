# Multi-stage optimized build for Telegram Mini App
# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies with cache mount for Railway
RUN --mount=type=cache,id=s/telegram-npm,target=/root/.npm \
    npm ci --cache /root/.npm --prefer-offline

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and source code
COPY package*.json ./
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_TELEGRAM_BOT_USERNAME
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_TELEGRAM_BOT_USERNAME=${VITE_TELEGRAM_BOT_USERNAME}

# Build the application with optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# Stage 3: Production - minimal nginx image
FROM nginx:alpine

# Install gettext for envsubst and add curl for health checks
RUN apk add --no-cache gettext curl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create optimized nginx configuration with gzip and caching
RUN echo 'server { \
    listen $PORT; \
    listen [::]:$PORT; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    \
    location /assets { \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Health check endpoint \
    location /health { \
        access_log off; \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

# Railway will provide PORT environment variable
EXPOSE 80

# Health check for Railway monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Use shell form to expand PORT variable
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"