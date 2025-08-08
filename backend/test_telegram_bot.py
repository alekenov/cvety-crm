#!/usr/bin/env python3
"""
Test script for Telegram Bot functionality
Usage: python test_telegram_bot.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_service import telegram_service
from app.core.config import get_settings


async def test_telegram_bot():
    """Test Telegram bot initialization and basic functionality"""
    settings = get_settings()
    
    # Check if token is configured
    if not settings.TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not configured in .env")
        print("Please add: TELEGRAM_BOT_TOKEN=your-bot-token-here")
        return False
    
    print(f"🔧 Testing Telegram Bot...")
    print(f"Token: {settings.TELEGRAM_BOT_TOKEN[:20]}...")
    
    try:
        # Initialize bot
        await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
        print("✅ Bot initialized successfully")
        
        # Get bot info
        bot_info = await telegram_service.bot.get_me()
        print(f"✅ Bot username: @{bot_info.username}")
        print(f"✅ Bot name: {bot_info.first_name}")
        
        # Test webhook status
        webhook_info = await telegram_service.bot.get_webhook_info()
        if webhook_info.url:
            print(f"📡 Webhook URL: {webhook_info.url}")
        else:
            print("📡 No webhook configured (polling mode)")
        
        print("\n🎉 Telegram Bot test completed successfully!")
        print("\nTo test the bot:")
        print(f"1. Open Telegram and search for @{bot_info.username}")
        print("2. Send /start command")
        print("3. Send your phone number")
        print("4. You should receive an OTP code")
        
        # Cleanup
        await telegram_service.stop()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def test_otp_flow():
    """Test OTP generation and validation flow"""
    from app.services.otp_service import otp_service
    
    print("\n🔧 Testing OTP Service...")
    
    # Test phone number
    test_phone = "+77011234567"
    
    # Generate OTP
    otp = otp_service.generate_otp(test_phone)
    if otp:
        print(f"✅ OTP generated for {test_phone}: {otp}")
        
        # Verify OTP
        is_valid = otp_service.verify_otp(test_phone, otp)
        if is_valid:
            print(f"✅ OTP verified successfully")
        else:
            print(f"❌ OTP verification failed")
    else:
        print(f"❌ Failed to generate OTP (rate limited?)")
    
    print("✅ OTP Service test completed")


async def main():
    """Run all tests"""
    print("=" * 50)
    print("Telegram Bot Integration Test")
    print("=" * 50)
    
    # Test Telegram bot
    bot_ok = await test_telegram_bot()
    
    # Test OTP service
    await test_otp_flow()
    
    print("\n" + "=" * 50)
    if bot_ok:
        print("✅ All tests passed!")
    else:
        print("⚠️ Some tests failed. Check configuration.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())