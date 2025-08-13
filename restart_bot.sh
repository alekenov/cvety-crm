#!/bin/bash

# Скрипт для перезапуска Telegram бота с новой логикой

echo "🤖 Перезапуск Telegram бота @lekenbot"

# Остановить старые процессы Python с ботами
echo "⏹️ Останавливаем старые боты..."
pkill -f "telegram_bot.py"
pkill -f "simple_telegram_bot.py"

# Подождать 2 секунды
sleep 2

# Запустить новый простой бот
echo "🚀 Запускаем простого бота..."
cd backend
nohup python3 simple_telegram_bot.py > bot.log 2>&1 &

# Получить PID процесса
BOT_PID=$!
echo "✅ Простой бот запущен (PID: $BOT_PID)"

# Показать логи
echo "📝 Логи бота:"
sleep 1
tail -f bot.log