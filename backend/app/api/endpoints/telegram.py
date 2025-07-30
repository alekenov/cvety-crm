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
        update = Update(**data)
        
        # Process update
        if telegram_service.webhook_handler:
            await telegram_service.webhook_handler.handle(update)
            return Response(status_code=200)
        else:
            logger.error("Webhook handler not initialized")
            return Response(status_code=500)
    
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
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