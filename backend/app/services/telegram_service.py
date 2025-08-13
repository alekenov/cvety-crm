import logging
from typing import Optional, Dict, Any
import asyncio
from aiogram import Bot

from app.core.config import get_settings
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class TelegramService:
    """Simplified Telegram service for OTP and order notifications"""
    
    def __init__(self):
        self.bot = None
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