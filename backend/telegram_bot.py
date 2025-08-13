#!/usr/bin/env python3
"""
DEPRECATED: Old Telegram Bot for Cvety.kz
Use simple_telegram_bot.py instead - it has simpler logic without Mini App
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo, ReplyKeyboardRemove
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.crud import shop as crud_shop
from app.crud import user as crud_user
from app.models.user import UserRole
from app.schemas.shop import ShopCreate
from app.schemas.user import UserCreate

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Initialize bot and dispatcher
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
router = Router()


class RegistrationForm(StatesGroup):
    """States for registration flow"""
    waiting_for_shop_name = State()
    waiting_for_city = State()


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
    
    return phone  # Return as-is if format is unexpected


@router.message(CommandStart())
async def start_handler(message: Message, state: FSMContext):
    """Handle /start command"""
    await state.clear()  # Clear any existing state
    
    user_name = message.from_user.first_name or "Пользователь"
    
    # Create keyboard with contact request button
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Поделиться номером телефона", request_contact=True)]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    welcome_text = (
        f"👋 Здравствуйте, {user_name}!\n\n"
        "🌸 Добро пожаловать в *Cvety.kz* - систему управления цветочным магазином.\n\n"
        "Для начала работы, пожалуйста, поделитесь своим номером телефона.\n"
        "Это необходимо для идентификации вашего магазина."
    )
    
    await message.answer(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=keyboard
    )


@router.message(F.contact)
async def contact_handler(message: Message, state: FSMContext):
    """Handle contact sharing"""
    contact = message.contact
    
    # Get phone number
    phone = format_phone(contact.phone_number)
    telegram_id = str(message.from_user.id)
    telegram_username = message.from_user.username
    first_name = message.from_user.first_name or ""
    last_name = message.from_user.last_name or ""
    
    # Save user data to state
    await state.update_data(
        phone=phone,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        first_name=first_name,
        last_name=last_name
    )
    
    # Check if shop exists
    db = get_db()
    try:
        shop = crud_shop.get_by_phone(db, phone=phone)
        
        if shop:
            # Shop exists - update telegram info and show Mini App button
            shop = crud_shop.update_telegram(
                db,
                db_obj=shop,
                telegram_id=telegram_id,
                telegram_username=telegram_username
            )
            db.commit()
            
            # Create keyboard with Mini App button
            webapp_url = f"{settings.TELEGRAM_MINIAPP_URL}?phone={phone}"
            keyboard = ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(
                        text="🏪 Открыть магазин",
                        web_app=WebAppInfo(url=webapp_url)
                    )]
                ],
                resize_keyboard=True,
                persistent=True
            )
            
            success_text = (
                f"✅ Добро пожаловать, *{shop.name}*!\n\n"
                "Ваш магазин успешно идентифицирован.\n"
                "Нажмите кнопку ниже, чтобы открыть панель управления."
            )
            
            await message.answer(
                success_text,
                parse_mode="Markdown",
                reply_markup=keyboard
            )
        else:
            # Shop doesn't exist - start registration
            await state.set_state(RegistrationForm.waiting_for_shop_name)
            
            registration_text = (
                "🆕 Похоже, вы еще не зарегистрированы в системе.\n\n"
                "Давайте создадим ваш магазин!\n\n"
                "Как называется ваш цветочный магазин?"
            )
            
            await message.answer(
                registration_text,
                reply_markup=ReplyKeyboardRemove()
            )
    finally:
        db.close()


@router.message(RegistrationForm.waiting_for_shop_name)
async def process_shop_name(message: Message, state: FSMContext):
    """Process shop name during registration"""
    shop_name = message.text.strip()
    
    if len(shop_name) < 2:
        await message.answer("❌ Название магазина должно содержать минимум 2 символа. Попробуйте еще раз:")
        return
    
    await state.update_data(shop_name=shop_name)
    await state.set_state(RegistrationForm.waiting_for_city)
    
    # Create keyboard with city options
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Алматы")],
            [KeyboardButton(text="Астана")],
            [KeyboardButton(text="Шымкент")],
            [KeyboardButton(text="Другой город")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    await message.answer(
        "В каком городе находится ваш магазин?",
        reply_markup=keyboard
    )


@router.message(RegistrationForm.waiting_for_city)
async def process_city(message: Message, state: FSMContext):
    """Process city during registration"""
    city = message.text.strip()
    
    if city == "Другой город":
        await message.answer(
            "Введите название вашего города:",
            reply_markup=ReplyKeyboardRemove()
        )
        return
    
    # Get all registration data
    data = await state.get_data()
    
    # Create shop in database
    db = get_db()
    try:
        # Create shop
        shop_data = ShopCreate(
            name=data['shop_name'],
            phone=data['phone'],
            city=city,
            telegram_id=data['telegram_id'],
            telegram_username=data.get('telegram_username')
        )
        shop = crud_shop.create(db, obj_in=shop_data)
        
        # Create admin user
        full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        admin_user_data = UserCreate(
            phone=data['phone'],
            name=full_name or data['shop_name'],
            email=f"telegram{data['telegram_id']}@cvety.kz",
            role=UserRole.admin,
            is_active=True
        )
        admin_user = crud_user.create(db, obj_in=admin_user_data, shop_id=shop.id)
        
        db.commit()
        
        # Clear state
        await state.clear()
        
        # Create keyboard with Mini App button
        webapp_url = f"{settings.TELEGRAM_MINIAPP_URL}?phone={data['phone']}"
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(
                    text="🏪 Открыть магазин",
                    web_app=WebAppInfo(url=webapp_url)
                )]
            ],
            resize_keyboard=True,
            persistent=True
        )
        
        success_text = (
            f"🎉 Поздравляем! Магазин *{shop.name}* успешно зарегистрирован!\n\n"
            f"📍 Город: {city}\n"
            f"📱 Телефон: {data['phone']}\n\n"
            "Нажмите кнопку ниже, чтобы начать работу с системой."
        )
        
        await message.answer(
            success_text,
            parse_mode="Markdown",
            reply_markup=keyboard
        )
        
        # Send additional info
        info_text = (
            "ℹ️ *Что вы можете делать в системе:*\n\n"
            "• Управлять каталогом товаров\n"
            "• Принимать и обрабатывать заказы\n"
            "• Управлять клиентской базой\n"
            "• Контролировать складские остатки\n"
            "• Просматривать аналитику продаж\n\n"
            "Удачной работы! 🌸"
        )
        
        await message.answer(info_text, parse_mode="Markdown")
        
    except Exception as e:
        logger.error(f"Error creating shop: {e}")
        await message.answer(
            "❌ Произошла ошибка при регистрации. Попробуйте позже или обратитесь в поддержку.",
            reply_markup=ReplyKeyboardRemove()
        )
        await state.clear()
    finally:
        db.close()


@router.message(Command("help"))
async def help_handler(message: Message):
    """Handle /help command"""
    help_text = (
        "📚 *Помощь по использованию бота*\n\n"
        "Доступные команды:\n"
        "/start - Начать работу с ботом\n"
        "/help - Показать это сообщение\n"
        "/shop - Открыть панель управления\n\n"
        "Если у вас возникли вопросы, обратитесь в поддержку:\n"
        "📧 support@cvety.kz\n"
        "📱 +7 (777) 123-45-67"
    )
    
    await message.answer(help_text, parse_mode="Markdown")


@router.message(Command("shop"))
async def shop_handler(message: Message):
    """Handle /shop command - show Mini App button"""
    telegram_id = str(message.from_user.id)
    
    # Find shop by telegram_id
    db = get_db()
    try:
        from app.models.shop import Shop
        shop = db.query(Shop).filter_by(telegram_id=telegram_id).first()
        
        if shop:
            # Create keyboard with Mini App button
            webapp_url = f"{settings.TELEGRAM_MINIAPP_URL}?phone={shop.phone}"
            keyboard = ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(
                        text="🏪 Открыть магазин",
                        web_app=WebAppInfo(url=webapp_url)
                    )]
                ],
                resize_keyboard=True,
                persistent=True
            )
            
            await message.answer(
                f"Нажмите кнопку ниже, чтобы открыть *{shop.name}*",
                parse_mode="Markdown",
                reply_markup=keyboard
            )
        else:
            await message.answer(
                "❌ Магазин не найден. Используйте /start для регистрации.",
                parse_mode="Markdown"
            )
    finally:
        db.close()


@router.message()
async def echo_handler(message: Message, state: FSMContext):
    """Handle all other messages"""
    current_state = await state.get_state()
    
    # If we're waiting for city and user types custom city name
    if current_state == RegistrationForm.waiting_for_city:
        await process_city(message, state)
    else:
        await message.answer(
            "Не понимаю эту команду. Используйте /help для списка доступных команд."
        )


async def main():
    """Start the bot"""
    # Register router
    dp.include_router(router)
    
    # Delete webhook (use polling)
    await bot.delete_webhook(drop_pending_updates=True)
    
    # Start polling
    logger.info("Bot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    # Check if token exists
    if not settings.TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not set in .env file")
        sys.exit(1)
    
    # Check if Mini App URL is set
    if not settings.TELEGRAM_MINIAPP_URL:
        print("⚠️ TELEGRAM_MINIAPP_URL not set, using default")
        settings.TELEGRAM_MINIAPP_URL = "https://telegram-miniapp-production.up.railway.app"
    
    print(f"🤖 Starting Telegram Bot...")
    print(f"📱 Mini App URL: {settings.TELEGRAM_MINIAPP_URL}")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped")