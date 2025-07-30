import logging
from typing import Optional, Dict, Any
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.webhook.aiohttp_server import SimpleRequestHandler
import aiohttp.web

from app.core.config import get_settings
from app.services.otp_service import otp_service

logger = logging.getLogger(__name__)


class TelegramService:
    """Service for Telegram bot operations"""
    
    def __init__(self):
        self.bot = None
        self.dp = None
        self.webhook_handler = None
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
            self.dp = Dispatcher()
            
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
        async def start_handler(message: Message):
            """Handle /start command"""
            welcome_text = (
                "🌸 Добро пожаловать в Cvety.kz!\n\n"
                "Я помогу вам войти в систему управления цветочным магазином.\n\n"
                "Для авторизации отправьте мне ваш номер телефона в формате:\n"
                "+7 XXX XXX XX XX"
            )
            await message.answer(welcome_text)
        
        @self.dp.message()
        async def message_handler(message: Message):
            """Handle all other messages"""
            # Check if message looks like a phone number
            phone = self._extract_phone_number(message.text)
            
            if phone:
                # Store telegram_id with phone for later verification
                await self._handle_phone_auth(message, phone)
            else:
                await message.answer(
                    "Пожалуйста, отправьте номер телефона в формате:\n"
                    "+7 XXX XXX XX XX"
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