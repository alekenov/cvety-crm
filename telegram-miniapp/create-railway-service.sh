#!/bin/bash

# Создание нового Railway проекта для telegram-miniapp
echo "🚀 Создание нового Railway проекта для Telegram Mini App..."

# Unlink от текущего проекта
railway unlink

# Создаем новый проект
echo "Creating new Railway project..."
railway init --name telegram-miniapp

# Устанавливаем переменные окружения
echo "Setting environment variables..."
echo "VITE_API_URL=https://cvety-kz-production.up.railway.app" > .env

# Деплоим
echo "Deploying..."
railway up --detach

# Генерируем домен
echo "Generating domain..."
railway domain

echo "✅ Deployment complete!"