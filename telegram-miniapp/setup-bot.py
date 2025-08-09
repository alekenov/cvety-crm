#!/usr/bin/env python3
"""
Скрипт для настройки Telegram Mini App в боте
"""

import requests
import json
import sys

# Токен бота
BOT_TOKEN = "7820558956:AAGQiNqe-AZjG69mo4KR5l6gJwZBrPUy_-w"
MINI_APP_URL = "https://cvety-kz-production.up.railway.app"

def setup_webapp_button():
    """Настройка кнопки Web App в меню бота"""
    
    # Устанавливаем кнопку меню для открытия Mini App
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/setChatMenuButton"
    
    payload = {
        "menu_button": {
            "type": "web_app",
            "text": "🎮 Открыть приложение",
            "web_app": {
                "url": MINI_APP_URL
            }
        }
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result.get("ok"):
        print(f"✅ Кнопка Mini App успешно настроена!")
        print(f"📱 URL: {MINI_APP_URL}")
        return True
    else:
        print(f"❌ Ошибка настройки кнопки: {result}")
        return False

def get_bot_info():
    """Получение информации о боте"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
    response = requests.get(url)
    result = response.json()
    
    if result.get("ok"):
        bot = result["result"]
        print(f"\n🤖 Информация о боте:")
        print(f"  Имя: {bot.get('first_name')}")
        print(f"  Username: @{bot.get('username')}")
        print(f"  ID: {bot.get('id')}")
        return bot
    else:
        print(f"❌ Ошибка получения информации о боте: {result}")
        return None

def setup_commands():
    """Настройка команд бота"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/setMyCommands"
    
    commands = [
        {"command": "start", "description": "Запустить бота"},
        {"command": "webapp", "description": "Открыть Mini App"},
        {"command": "help", "description": "Помощь"},
    ]
    
    response = requests.post(url, json={"commands": commands})
    result = response.json()
    
    if result.get("ok"):
        print("✅ Команды бота настроены")
        return True
    else:
        print(f"❌ Ошибка настройки команд: {result}")
        return False

def main():
    print("🚀 Настройка Telegram Mini App для бота\n")
    
    # Получаем информацию о боте
    bot_info = get_bot_info()
    if not bot_info:
        print("❌ Не удалось получить информацию о боте. Проверьте токен.")
        sys.exit(1)
    
    # Настраиваем кнопку Web App
    print("\n⚙️ Настройка кнопки Mini App...")
    if setup_webapp_button():
        print("\n✅ Настройка завершена успешно!")
        print(f"\n📱 Как протестировать:")
        print(f"1. Откройте Telegram")
        print(f"2. Найдите бота @{bot_info.get('username')}")
        print(f"3. Нажмите кнопку меню слева от поля ввода")
        print(f"4. Выберите '🎮 Открыть приложение'")
        print(f"\n⚠️ Важно: ngrok туннель должен быть запущен!")
        print(f"📍 Текущий URL: {MINI_APP_URL}")
    else:
        print("\n❌ Настройка не удалась")
        sys.exit(1)
    
    # Настраиваем команды
    print("\n⚙️ Настройка команд бота...")
    setup_commands()

if __name__ == "__main__":
    main()