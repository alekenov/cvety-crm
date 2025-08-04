from typing import Optional
from pydantic import BaseModel


class AddressUpdateRequest(BaseModel):
    """Request to update delivery address"""
    address: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None


class AddressUpdateResponse(BaseModel):
    """Response after address update"""
    success: bool
    message: str
    updated_address: str