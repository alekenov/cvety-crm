import logging
from typing import Optional, Dict, Any
import asyncio
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.filters import CommandStart, Command
from aiogram.fsm.storage.memory import MemoryStorage

from app.core.config import get_settings
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class TelegramService:
    """Simplified Telegram service for OTP and order notifications"""
    
    def __init__(self):
        self.bot = None
        self.dp = None
        self.router = None
        self._initialized = False
        
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
            
            # Initialize dispatcher with memory storage
            storage = MemoryStorage()
            self.dp = Dispatcher(storage=storage)
            
            # Create router for handlers
            self.router = Router()
            
            # Register handlers
            self._register_handlers()
            
            # Include router in dispatcher
            self.dp.include_router(self.router)
            
            # Verify bot token
            bot_info = await self.bot.get_me()
            logger.info(f"Telegram bot initialized: @{bot_info.username}")
            
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize Telegram bot: {e}")
            raise
    
    async def send_otp(self, telegram_id: int, otp_code: str) -> bool:
        """Send OTP to specific Telegram user"""
        if not self._initialized:
            logger.error("Telegram bot not initialized")
            return False
        
        try:
            message = (
                f"🔐 **Код подтверждения для входа в CRM:**\n\n"
                f"**{otp_code}**\n\n"
                "Введите этот код на сайте.\n"
                "⏱ Код действителен 5 минут."
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
    async def send_order_notification(self, telegram_id: int, order_info: dict) -> bool:
        """Send order notification to Telegram user"""
        if not self._initialized:
            logger.error("Telegram bot not initialized")
            return False
        
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
            
            await self.bot.send_message(
                chat_id=telegram_id,
                text=message,
                parse_mode="Markdown"
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to send order notification to Telegram user {telegram_id}: {e}")
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
    
    async def start_polling(self):
        """Start polling (placeholder method - not implemented for simple service)"""
        logger.info("Telegram polling mode not implemented in this service")
        # This is a placeholder method since we're only using webhook/direct sending
        pass
    
    async def setup_webhook(self, webhook_url: str, webhook_path: str = "/api/telegram/webhook"):
        """Setup webhook for production"""
        if not self._initialized:
            logger.error("Bot not initialized")
            return
        
        try:
            full_webhook_url = f"{webhook_url.rstrip('/')}{webhook_path}"
            await self.bot.set_webhook(url=full_webhook_url)
            logger.info(f"Webhook set to: {full_webhook_url}")
        except Exception as e:
            logger.error(f"Failed to set webhook: {e}")
            raise

    def _register_handlers(self):
        """Register message handlers"""
        @self.router.message(CommandStart())
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

        @self.router.message(F.contact)
        async def contact_handler(message: Message):
            """Handle contact sharing"""
            contact = message.contact
            phone = self._format_phone(contact.phone_number)
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

        @self.router.message(Command("help"))
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

        @self.router.message(Command("status"))
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

        @self.router.message()
        async def general_handler(message: Message):
            """Handle all other messages"""
            text = message.text or ""
            
            # Try to extract phone number for backward compatibility
            phone = self._extract_phone_number(text)
            
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
    
    def _format_phone(self, phone: str) -> str:
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