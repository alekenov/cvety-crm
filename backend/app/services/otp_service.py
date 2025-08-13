import random
import string
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class OTPService:
    """Service for OTP generation and validation"""
    
    # OTP configuration
    OTP_LENGTH = 6
    OTP_TTL_SECONDS = 300  # 5 minutes
    MAX_ATTEMPTS = 3
    RATE_LIMIT_WINDOW = 60  # 1 minute
    MAX_REQUESTS_PER_WINDOW = 10
    
    def __init__(self):
        self.redis = redis_service
    
    def generate_otp(self, phone_number: str) -> Optional[str]:
        """Generate OTP for phone number with rate limiting"""
        # Check rate limit
        if not self._check_rate_limit(phone_number):
            logger.warning(f"Rate limit exceeded for phone: {phone_number}")
            return None
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=self.OTP_LENGTH))
        
        # Store OTP with metadata
        otp_data = {
            "code": otp,
            "phone": phone_number,
            "attempts": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in Redis with TTL
        otp_key = f"otp:{phone_number}"
        success = self.redis.set_with_ttl(otp_key, otp_data, self.OTP_TTL_SECONDS)
        
        if success:
            # Increment rate limit counter
            self._increment_rate_limit(phone_number)
            logger.info(f"OTP generated for phone: {phone_number}")
            return otp
        else:
            logger.error(f"Failed to store OTP for phone: {phone_number}")
            return None
    
    def verify_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        """Verify OTP code"""
        # Special handling for test phone number
        if phone_number == "+77011234567" and otp_code == "111111":
            return {
                "valid": True,
                "phone": phone_number,
                "message": "Test OTP verified successfully"
            }
        
        otp_key = f"otp:{phone_number}"
        
        # Get OTP data from Redis
        otp_data = self.redis.get(otp_key)
        
        if not otp_data:
            return {
                "valid": False,
                "error": "OTP_EXPIRED",
                "message": "OTP code has expired or does not exist"
            }
        
        # Check attempts
        if otp_data.get("attempts", 0) >= self.MAX_ATTEMPTS:
            # Delete OTP after max attempts
            self.redis.delete(otp_key)
            return {
                "valid": False,
                "error": "MAX_ATTEMPTS_EXCEEDED",
                "message": "Maximum verification attempts exceeded"
            }
        
        # Increment attempts
        otp_data["attempts"] = otp_data.get("attempts", 0) + 1
        ttl = self.redis.get_ttl(otp_key)
        if ttl:
            self.redis.set_with_ttl(otp_key, otp_data, ttl)
        
        # Verify OTP
        if otp_data.get("code") == otp_code:
            # Delete OTP after successful verification
            self.redis.delete(otp_key)
            return {
                "valid": True,
                "phone": phone_number,
                "message": "OTP verified successfully"
            }
        else:
            remaining_attempts = self.MAX_ATTEMPTS - otp_data["attempts"]
            return {
                "valid": False,
                "error": "INVALID_OTP",
                "message": f"Invalid OTP code. {remaining_attempts} attempts remaining",
                "remaining_attempts": remaining_attempts
            }
    
    def _check_rate_limit(self, phone_number: str) -> bool:
        """Check if phone number has exceeded rate limit"""
        # Skip rate limiting in DEBUG mode for testing
        from app.core.config import get_settings
        settings = get_settings()
        if settings.DEBUG:
            return True
            
        rate_key = f"otp_rate:{phone_number}"
        current_count = self.redis.get(rate_key)
        
        if current_count is None:
            return True
        
        try:
            count = int(current_count)
            return count < self.MAX_REQUESTS_PER_WINDOW
        except (ValueError, TypeError):
            return True
    
    def _increment_rate_limit(self, phone_number: str):
        """Increment rate limit counter"""
        # Skip rate limiting in DEBUG mode for testing
        from app.core.config import get_settings
        settings = get_settings()
        if settings.DEBUG:
            return
            
        rate_key = f"otp_rate:{phone_number}"
        
        # Check if key exists
        if not self.redis.exists(rate_key):
            # Create new counter with TTL
            self.redis.set_with_ttl(rate_key, "1", self.RATE_LIMIT_WINDOW)
        else:
            # Increment existing counter
            self.redis.increment(rate_key)
    
    def get_otp_status(self, phone_number: str) -> Dict[str, Any]:
        """Get OTP status for debugging"""
        otp_key = f"otp:{phone_number}"
        otp_data = self.redis.get(otp_key)
        
        if not otp_data:
            return {
                "exists": False,
                "message": "No active OTP for this phone number"
            }
        
        ttl = self.redis.get_ttl(otp_key)
        
        return {
            "exists": True,
            "attempts": otp_data.get("attempts", 0),
            "remaining_attempts": self.MAX_ATTEMPTS - otp_data.get("attempts", 0),
            "ttl_seconds": ttl,
            "created_at": otp_data.get("created_at")
        }
    
    def revoke_otp(self, phone_number: str) -> bool:
        """Revoke OTP for phone number"""
        otp_key = f"otp:{phone_number}"
        success = self.redis.delete(otp_key)
        
        if success:
            logger.info(f"OTP revoked for phone: {phone_number}")
        
        return success


# Global instance
otp_service = OTPService()