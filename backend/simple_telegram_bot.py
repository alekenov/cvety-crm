#!/usr/bin/env python3
"""
Simple Telegram Bot for Cvety.kz OTP Authentication
Handles only OTP sending and order notifications - no Mini App
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Optional

from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.filters import CommandStart, Command
from aiogram.fsm.storage.memory import MemoryStorage
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.redis_service import redis_service

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Initialize bot and dispatcher (will use token from config.py)
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
router = Router()


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Don't close here, close in the calling function


def format_phone(phone: str) -> str:
    """Format phone number to +7XXXXXXXXXX format"""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Ensure it starts with 7 and has 11 digits total
    if len(digits) == 11 and digits.startswith('7'):
        return f"+{digits}"
    elif len(digits) == 10:
        return f"+7{digits}"
    elif len(digits) == 11 and digits.startswith('8'):
        return f"+7{digits[1:]}"
    
    return phone  # Return as-is if format is unexpected


@router.message(CommandStart())
async def start_handler(message: Message):
    """Handle /start command"""
    user_name = message.from_user.first_name or "Пользователь"
    
    welcome_text = (
        f"👋 Привет, {user_name}!\n\n"
        "🔐 Я помогаю с авторизацией и отправляю коды подтверждения\n\n"
        "📱 **Как получить код:**\n"
        "1. Поделитесь своим контактом (кнопка ниже)\n"
        "2. Введите тот же номер на сайте\n"
        "3. Нажмите «Получить код» на сайте\n"
        "4. Получите код в этом чате\n\n"
        "👇 Нажмите кнопку ниже, чтобы поделиться контактом"
    )
    
    # Создаем клавиатуру с кнопкой запроса контакта
    contact_button = KeyboardButton(text="📱 Поделиться контактом", request_contact=True)
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[contact_button]],
        resize_keyboard=True,
        one_time_keyboard=True,
        input_field_placeholder="Нажмите кнопку выше"
    )
    
    await message.answer(welcome_text, reply_markup=keyboard)


@router.message(F.contact)
async def contact_handler(message: Message):
    """Handle contact sharing"""
    contact = message.contact
    phone = format_phone(contact.phone_number)
    telegram_id = str(message.from_user.id)
    telegram_username = message.from_user.username
    
    # Save telegram_id mapping to Redis
    telegram_data = {
        "telegram_id": telegram_id,
        "telegram_username": telegram_username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name
    }
    
    # Store for 24 hours
    redis_service.set_with_ttl(f"telegram:{phone}", telegram_data, 86400)
    
    success_text = (
        f"✅ Отлично! Номер {phone} связан с ботом\n\n"
        "🔐 Теперь вы будете получать коды подтверждения в этот чат\n"
        "📦 А также уведомления о заказах\n\n"
        "Можете авторизоваться на сайте!"
    )
    
    # Удаляем клавиатуру после успешной регистрации контакта
    await message.answer(success_text, reply_markup=ReplyKeyboardRemove())
    logger.info(f"Phone {phone} linked to Telegram user {telegram_id}")


@router.message(Command("help"))
async def help_handler(message: Message):
    """Handle /help command"""
    help_text = (
        "🆘 **Помощь по использованию бота**\n\n"
        "**Команды:**\n"
        "/start - Инструкция по использованию\n"
        "/help - Показать эту справку\n"
        "/status - Проверить подключенный номер\n\n"
        "**Как получить код авторизации:**\n"
        "1️⃣ Поделитесь контактом через /start\n"
        "2️⃣ На сайте нажмите «Получить код»\n" 
        "3️⃣ Код придет в этот чат\n\n"
        "**Что еще умеет бот:**\n"
        "📦 Отправляет уведомления о новых заказах"
    )
    
    await message.answer(help_text, parse_mode="Markdown")


@router.message(Command("status"))
async def status_handler(message: Message):
    """Handle /status command - check if phone is linked"""
    telegram_id = str(message.from_user.id)
    
    # Search for linked phone numbers
    phone_keys = redis_service.redis.keys("telegram:+7*")
    linked_phone = None
    
    for key in phone_keys:
        data = redis_service.get(key.decode())
        if data and data.get("telegram_id") == telegram_id:
            linked_phone = key.decode().replace("telegram:", "")
            break
    
    if linked_phone:
        await message.answer(
            f"✅ Подключен номер: {linked_phone}\n\n"
            "🔐 Коды подтверждения: активно\n"
            "📦 Уведомления о заказах: активно"
        )
    else:
        await message.answer(
            "❌ Номер телефона не подключен\n\n"
            "Отправьте свой номер телефона боту для получения кодов"
        )


@router.message()
async def general_handler(message: Message):
    """Handle all other messages"""
    text = message.text or ""
    
    # Try to extract phone number for backward compatibility
    phone = extract_phone_number(text)
    
    if phone:
        telegram_id = str(message.from_user.id)
        telegram_username = message.from_user.username
        
        # Save telegram_id mapping to Redis
        telegram_data = {
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "first_name": message.from_user.first_name,
            "last_name": message.from_user.last_name
        }
        
        # Store for 24 hours
        redis_service.set_with_ttl(f"telegram:{phone}", telegram_data, 86400)
        
        success_text = (
            f"✅ Номер {phone} подключен к боту!\n\n"
            "🔐 Коды подтверждения будут приходить в этот чат\n"
            "📦 Получите уведомления о новых заказах\n\n"
            "Теперь можете авторизоваться на сайте!"
        )
        
        await message.answer(success_text, reply_markup=ReplyKeyboardRemove())
        logger.info(f"Phone {phone} linked to Telegram user {telegram_id}")
    else:
        # Предлагаем использовать кнопку контакта
        await message.answer(
            "👋 Для авторизации используйте команду /start\n"
            "и поделитесь контактом через кнопку!\n\n"
            "Это быстрее и удобнее 😊"
        )


def extract_phone_number(text: str) -> Optional[str]:
    """Extract and normalize phone number from text"""
    if not text:
        return None
    
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, text))
    
    # Check Kazakhstan phone formats
    if len(digits) == 11 and digits.startswith('7'):
        # Format: 7XXXXXXXXXX
        return f"+{digits}"
    elif len(digits) == 10:
        # Format: XXXXXXXXXX (without country code)
        return f"+7{digits}"
    elif len(digits) == 11 and digits.startswith('8'):
        # Format: 8XXXXXXXXXX (replace 8 with +7)
        return f"+7{digits[1:]}"
    
    return None


async def send_otp_to_user(telegram_id: int, otp_code: str) -> bool:
    """Send OTP code to specific Telegram user"""
    try:
        message = (
            f"🔐 **Код подтверждения для входа в CRM:**\n\n"
            f"**{otp_code}**\n\n"
            "Введите этот код на сайте.\n"
            "⏱ Код действителен 5 минут."
        )
        
        await bot.send_message(
            chat_id=telegram_id,
            text=message,
            parse_mode="Markdown"
        )
        
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP to Telegram user {telegram_id}: {e}")
        return False


async def send_order_notification(telegram_id: int, order_info: dict) -> bool:
    """Send order notification to Telegram user"""
    try:
        message = (
            f"📦 **Новый заказ #{order_info.get('id')}**\n\n"
            f"💰 Сумма: {order_info.get('total', 0):,} ₸\n"
            f"👤 Клиент: {order_info.get('customer_name', 'Не указан')}\n"
            f"📞 Телефон: {order_info.get('customer_phone', 'Не указан')}\n"
            f"📍 Адрес: {order_info.get('delivery_address', 'Не указан')}\n\n"
            f"⏰ Время заказа: {order_info.get('created_at', '')}\n\n"
            "Проверьте заказ в CRM системе!"
        )
        
        await bot.send_message(
            chat_id=telegram_id,
            text=message,
            parse_mode="Markdown"
        )
        
        return True
    except Exception as e:
        logger.error(f"Failed to send order notification to Telegram user {telegram_id}: {e}")
        return False


async def main():
    """Start the bot"""
    # Register router
    dp.include_router(router)
    
    # Delete webhook (use polling)
    await bot.delete_webhook(drop_pending_updates=True)
    
    # Start polling
    logger.info("Simple Telegram bot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    # Check if token exists
    if not settings.TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not set in environment variables")
        sys.exit(1)
    
    print(f"🤖 Starting Simple Telegram Bot...")
    print(f"📱 Bot will handle OTP codes and order notifications")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped")