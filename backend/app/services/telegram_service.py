import logging
from typing import Optional, Dict, Any
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.webhook.aiohttp_server import SimpleRequestHandler
import aiohttp.web
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.services.otp_service import otp_service
from app.db.session import SessionLocal
from app.crud import shop as crud_shop
from app.crud import user as crud_user
from app.models.user import UserRole
from app.schemas.shop import ShopCreate
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)


class RegistrationForm(StatesGroup):
    """States for registration flow"""
    waiting_for_shop_name = State()
    waiting_for_city = State()


class TelegramService:
    """Service for Telegram bot operations"""
    
    def __init__(self):
        self.bot = None
        self.dp = None
        self.webhook_handler = None
        self._initialized = False
        self.storage = MemoryStorage()
        
    async def initialize(self, token: str = None):
        """Initialize Telegram bot with token"""
        if self._initialized:
            return
            
        settings = get_settings()
        bot_token = token or getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        
        if not bot_token:
            logger.error("Telegram bot token not provided")
            return
        
        try:
            self.bot = Bot(token=bot_token)
            self.dp = Dispatcher(storage=self.storage)
            
            # Register handlers
            self._register_handlers()
            
            # Verify bot token
            bot_info = await self.bot.get_me()
            logger.info(f"Telegram bot initialized: @{bot_info.username}")
            
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize Telegram bot: {e}")
            raise
    
    def _register_handlers(self):
        """Register message handlers"""
        
        @self.dp.message(Command("start"))
        async def start_handler(message: Message, state: FSMContext):
            """Handle /start command"""
            await state.clear()  # Clear any existing state
            
            welcome_text = (
                "🌸 Добро пожаловать в Cvety.kz!\n\n"
                "Я помогу вам войти в систему управления цветочным магазином.\n\n"
                "Пожалуйста, поделитесь вашим номером телефона:"
            )
            
            # Create keyboard with phone request button
            keyboard = ReplyKeyboardMarkup(
                keyboard=[[
                    KeyboardButton(
                        text="📱 Поделиться номером телефона",
                        request_contact=True
                    )
                ]],
                resize_keyboard=True,
                one_time_keyboard=True
            )
            
            await message.answer(welcome_text, reply_markup=keyboard)
        
        @self.dp.message(F.contact)
        async def contact_handler(message: Message, state: FSMContext):
            """Handle contact sharing"""
            contact = message.contact
            phone = self._format_phone(contact.phone_number)
            
            # Get database session
            db = SessionLocal()
            try:
                shop = crud_shop.get_by_phone(db, phone=phone)
                
                if shop:
                    # Existing shop - show Mini App button
                    settings = get_settings()
                    webapp_url = f"{settings.TELEGRAM_MINIAPP_URL}?phone={phone}"
                    
                    keyboard = ReplyKeyboardMarkup(
                        keyboard=[[
                            KeyboardButton(
                                text="🏪 Открыть магазин",
                                web_app=WebAppInfo(url=webapp_url)
                            )
                        ]],
                        resize_keyboard=True
                    )
                    
                    await message.answer(
                        f"✅ Добро пожаловать, {shop.name}!\n\n"
                        "Нажмите кнопку ниже, чтобы открыть панель управления:",
                        reply_markup=keyboard
                    )
                    
                    # Update telegram_id if needed
                    if shop.telegram_id != str(message.from_user.id):
                        shop = crud_shop.update_telegram(
                            db,
                            db_obj=shop,
                            telegram_id=str(message.from_user.id),
                            telegram_username=message.from_user.username
                        )
                        db.commit()
                else:
                    # New user - start registration
                    await state.update_data(
                        phone=phone,
                        telegram_id=str(message.from_user.id),
                        telegram_username=message.from_user.username,
                        first_name=message.from_user.first_name,
                        last_name=message.from_user.last_name
                    )
                    await state.set_state(RegistrationForm.waiting_for_shop_name)
                    
                    await message.answer(
                        "📝 Вы еще не зарегистрированы.\n\n"
                        "Давайте создадим ваш магазин!\n"
                        "Как называется ваш цветочный магазин?",
                        reply_markup=ReplyKeyboardRemove()
                    )
            finally:
                db.close()
        
        @self.dp.message(RegistrationForm.waiting_for_shop_name)
        async def shop_name_handler(message: Message, state: FSMContext):
            """Handle shop name input during registration"""
            shop_name = message.text.strip()
            
            if len(shop_name) < 2:
                await message.answer("Название магазина должно содержать минимум 2 символа.")
                return
            
            await state.update_data(shop_name=shop_name)
            await state.set_state(RegistrationForm.waiting_for_city)
            
            # Create keyboard with city options
            keyboard = ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(text="Алматы")],
                    [KeyboardButton(text="Астана")],
                    [KeyboardButton(text="Шымкент")],
                    [KeyboardButton(text="Караганда")]
                ],
                resize_keyboard=True,
                one_time_keyboard=True
            )
            
            await message.answer(
                "🏙 В каком городе находится ваш магазин?",
                reply_markup=keyboard
            )
        
        @self.dp.message(RegistrationForm.waiting_for_city)
        async def city_handler(message: Message, state: FSMContext):
            """Handle city input and complete registration"""
            city = message.text.strip()
            data = await state.get_data()
            
            # Create shop in database
            db = SessionLocal()
            try:
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
                
                # Show Mini App button
                settings = get_settings()
                webapp_url = f"{settings.TELEGRAM_MINIAPP_URL}?phone={data['phone']}"
                
                keyboard = ReplyKeyboardMarkup(
                    keyboard=[[
                        KeyboardButton(
                            text="🏪 Открыть магазин",
                            web_app=WebAppInfo(url=webapp_url)
                        )
                    ]],
                    resize_keyboard=True
                )
                
                await message.answer(
                    f"🎉 Поздравляем! Магазин \"{shop.name}\" успешно создан!\n\n"
                    "Нажмите кнопку ниже, чтобы открыть панель управления:",
                    reply_markup=keyboard
                )
                
            except Exception as e:
                logger.error(f"Registration error: {e}")
                await message.answer(
                    "❌ Произошла ошибка при регистрации. Попробуйте позже или обратитесь в поддержку.",
                    reply_markup=ReplyKeyboardRemove()
                )
                await state.clear()
            finally:
                db.close()
        
        @self.dp.message()
        async def message_handler(message: Message, state: FSMContext):
            """Handle all other messages"""
            # Check if in registration state
            current_state = await state.get_state()
            if current_state:
                return  # Let state handlers handle it
            
            # Check if message looks like a phone number (backward compatibility)
            phone = self._extract_phone_number(message.text)
            
            if phone:
                await message.answer(
                    "Пожалуйста, используйте команду /start для начала работы"
                )
            else:
                await message.answer(
                    "Используйте команду /start для начала работы с ботом"
                )
    
    async def _handle_phone_auth(self, message: Message, phone: str):
        """Handle phone authentication request"""
        telegram_id = message.from_user.id
        telegram_username = message.from_user.username
        
        # Generate OTP
        otp = otp_service.generate_otp(phone)
        
        if not otp:
            await message.answer(
                "⚠️ Слишком много попыток. Попробуйте через минуту."
            )
            return
        
        # Store telegram_id association (will be used in auth endpoint)
        otp_service.redis.set_with_ttl(
            f"telegram:{phone}",
            {
                "telegram_id": telegram_id,
                "telegram_username": telegram_username
            },
            300  # 5 minutes
        )
        
        # Send OTP
        otp_message = (
            f"✅ Код подтверждения: *{otp}*\n\n"
            "Введите этот код на сайте для входа в систему.\n"
            "Код действителен 5 минут."
        )
        
        await message.answer(otp_message, parse_mode="Markdown")
        
        logger.info(f"OTP sent to Telegram user {telegram_id} for phone {phone}")
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number to +7XXXXXXXXXX format"""
        if not phone:
            return ""
        
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone))
        
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
        
        # Default - assume it's already formatted
        if not phone.startswith('+'):
            return f"+{phone}"
        return phone
    
    def _extract_phone_number(self, text: str) -> Optional[str]:
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
    
    async def send_otp(self, telegram_id: int, otp_code: str) -> bool:
        """Send OTP to specific Telegram user"""
        if not self._initialized:
            logger.error("Telegram bot not initialized")
            return False
        
        try:
            message = (
                f"🔐 Ваш код подтверждения: *{otp_code}*\n\n"
                "Код действителен 5 минут."
            )
            
            await self.bot.send_message(
                chat_id=telegram_id,
                text=message,
                parse_mode="Markdown"
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP to Telegram user {telegram_id}: {e}")
            return False
    
    async def send_notification(self, telegram_id: int, text: str) -> bool:
        """Send notification to Telegram user"""
        if not self._initialized:
            logger.error("Telegram bot not initialized")
            return False
        
        try:
            await self.bot.send_message(chat_id=telegram_id, text=text)
            return True
        except Exception as e:
            logger.error(f"Failed to send notification to Telegram user {telegram_id}: {e}")
            return False
    
    async def setup_webhook(self, webhook_url: str, webhook_path: str = "/api/telegram/webhook"):
        """Setup webhook for Telegram bot"""
        if not self._initialized:
            raise RuntimeError("Telegram bot not initialized")
        
        try:
            # Set webhook
            await self.bot.set_webhook(
                url=f"{webhook_url}{webhook_path}",
                drop_pending_updates=True
            )
            
            logger.info(f"Webhook set to: {webhook_url}{webhook_path}")
            
            # Create webhook handler
            self.webhook_handler = SimpleRequestHandler(
                dispatcher=self.dp,
                bot=self.bot
            )
            
        except Exception as e:
            logger.error(f"Failed to setup webhook: {e}")
            raise
    
    async def remove_webhook(self):
        """Remove webhook"""
        if self.bot:
            await self.bot.delete_webhook(drop_pending_updates=True)
            logger.info("Webhook removed")
    
    async def start_polling(self):
        """Start polling for development"""
        if not self._initialized:
            raise RuntimeError("Telegram bot not initialized")
        
        try:
            # Remove any existing webhook
            await self.remove_webhook()
            
            # Start polling
            logger.info("Starting Telegram bot polling...")
            await self.dp.start_polling(self.bot)
        except Exception as e:
            logger.error(f"Polling error: {e}")
            raise
    
    async def stop(self):
        """Stop bot and cleanup"""
        if self.bot:
            await self.bot.session.close()
            logger.info("Telegram bot stopped")


# Global instance
telegram_service = TelegramService()


# Helper function for async initialization
async def initialize_telegram_bot(token: str = None):
    """Initialize Telegram bot (call from async context)"""
    await telegram_service.initialize(token)