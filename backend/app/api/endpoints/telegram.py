from fastapi import APIRouter, Request, Response
from aiogram.types import Update
import logging

from app.services.telegram_service import telegram_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Handle Telegram webhook updates"""
    try:
        # Get update data
        data = await request.json()
        
        # Process update directly through dispatcher
        if telegram_service.dp and telegram_service.bot:
            # Create Update object from the JSON data
            update = Update.model_validate(data, context={"bot": telegram_service.bot})
            # Use feed_update for aiogram 3.x
            await telegram_service.dp.feed_update(telegram_service.bot, update)
            return Response(status_code=200)
        else:
            logger.error("Bot or dispatcher not initialized")
            return Response(status_code=500)
    
    except Exception as e:
        logger.error(f"Webhook processing error: {e}", exc_info=True)
        return Response(status_code=500)


@router.get("/webhook/status")
async def webhook_status():
    """Check webhook status"""
    if not telegram_service.bot:
        return {"status": "not_initialized"}
    
    try:
        webhook_info = await telegram_service.bot.get_webhook_info()
        return {
            "status": "active" if webhook_info.url else "inactive",
            "url": webhook_info.url,
            "pending_update_count": webhook_info.pending_update_count,
            "last_error_date": webhook_info.last_error_date,
            "last_error_message": webhook_info.last_error_message
        }
    except Exception as e:
        logger.error(f"Failed to get webhook status: {e}")
        return {"status": "error", "error": str(e)}


@router.post("/webhook/setup")
async def setup_webhook_manually():
    """Manually setup webhook (for debugging)"""
    if not telegram_service._initialized:
        return {"status": "error", "message": "Bot not initialized"}
    
    from app.core.config import get_settings
    settings = get_settings()
    
    if not settings.TELEGRAM_WEBHOOK_URL:
        return {"status": "error", "message": "TELEGRAM_WEBHOOK_URL not configured"}
    
    try:
        result = await telegram_service.setup_webhook(
            webhook_url=settings.TELEGRAM_WEBHOOK_URL,
            webhook_path="/api/telegram/webhook"
        )
        
        return {
            "status": "success" if result else "failed",
            "webhook_url": f"{settings.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook",
            "message": "Webhook setup completed" if result else "Webhook setup failed"
        }
    except Exception as e:
        logger.error(f"Manual webhook setup failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }