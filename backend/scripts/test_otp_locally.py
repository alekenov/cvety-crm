#!/usr/bin/env python3
"""
Test OTP service locally to ensure Redis implementation works correctly
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.otp_service import otp_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_otp_service():
    """Test OTP service functionality"""
    phone = "+77771234567"
    
    logger.info("🧪 Testing OTP Service")
    logger.info("="*40)
    
    # Test 1: Generate OTP
    logger.info("1. Generating OTP...")
    otp = otp_service.generate_otp(phone)
    
    if otp:
        logger.info(f"✅ OTP generated: {otp}")
    else:
        logger.error("❌ Failed to generate OTP")
        return False
    
    # Test 2: Check OTP status
    logger.info("2. Checking OTP status...")
    status = otp_service.get_otp_status(phone)
    logger.info(f"✅ OTP status: {status}")
    
    # Test 3: Verify correct OTP
    logger.info("3. Verifying correct OTP...")
    result = otp_service.verify_otp(phone, otp)
    if result.get("valid"):
        logger.info(f"✅ OTP verification successful: {result}")
    else:
        logger.error(f"❌ OTP verification failed: {result}")
        return False
    
    # Test 4: Generate new OTP for invalid test
    logger.info("4. Generating new OTP for invalid test...")
    otp2 = otp_service.generate_otp(phone)
    
    # Test 5: Verify incorrect OTP
    logger.info("5. Verifying incorrect OTP...")
    result = otp_service.verify_otp(phone, "wrong_code")
    if not result.get("valid"):
        logger.info(f"✅ Invalid OTP correctly rejected: {result}")
    else:
        logger.error(f"❌ Invalid OTP was accepted: {result}")
        return False
    
    # Test 6: Rate limiting
    logger.info("6. Testing rate limiting...")
    phone2 = "+77001234567"
    
    # Generate multiple OTPs quickly
    for i in range(12):  # Exceed the 10 per minute limit
        otp_result = otp_service.generate_otp(phone2)
        if i < 10:
            if otp_result:
                logger.info(f"   Request {i+1}: ✅ OTP generated")
            else:
                logger.error(f"   Request {i+1}: ❌ Should have generated OTP")
                return False
        else:
            if not otp_result:
                logger.info(f"   Request {i+1}: ✅ Rate limited correctly")
            else:
                logger.error(f"   Request {i+1}: ❌ Should have been rate limited")
                return False
    
    logger.info("🎉 All OTP tests passed!")
    return True


if __name__ == "__main__":
    try:
        success = test_otp_service()
        if success:
            logger.info("✅ OTP service is working correctly!")
            sys.exit(0)
        else:
            logger.error("❌ OTP service tests failed!")
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
        sys.exit(1)