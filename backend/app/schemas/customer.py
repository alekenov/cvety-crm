from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator


class CustomerAddressBase(BaseModel):
    address: str
    label: Optional[str] = None
    is_primary: Optional[bool] = False


class CustomerAddressCreate(CustomerAddressBase):
    pass


class CustomerAddressUpdate(CustomerAddressBase):
    address: Optional[str] = None


class CustomerAddress(CustomerAddressBase):
    id: int
    customer_id: int
    is_primary: bool = False
    usage_count: int
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerImportantDateBase(BaseModel):
    date: str = Field(pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$")  # MM-DD format
    description: str
    remind_days_before: int = 3


class CustomerImportantDateCreate(CustomerImportantDateBase):
    pass


class CustomerImportantDateUpdate(CustomerImportantDateBase):
    date: Optional[str] = Field(default=None, pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$")
    description: Optional[str] = None
    remind_days_before: Optional[int] = None


class CustomerImportantDate(CustomerImportantDateBase):
    id: int
    customer_id: int
    last_reminded_year: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    preferences: Optional[str] = None
    source: Optional[str] = None
    
    @validator('phone')
    def normalize_phone(cls, v):
        """Normalize phone number to standard format"""
        # Remove all non-digits
        digits = ''.join(filter(str.isdigit, v))
        
        # Handle Kazakhstan phone formats
        if digits.startswith('7') and len(digits) == 11:
            return f"+{digits}"
        elif digits.startswith('8') and len(digits) == 11:
            return f"+7{digits[1:]}"
        elif len(digits) == 10:
            return f"+7{digits}"
        
        # Return as-is if doesn't match expected format
        return v


class CustomerCreate(CustomerBase):
    addresses: Optional[List[CustomerAddressCreate]] = []
    important_dates: Optional[List[CustomerImportantDateCreate]] = []


class CustomerUpdate(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    preferences: Optional[str] = None
    source: Optional[str] = None
    addresses: Optional[List[dict]] = None
    important_dates: Optional[List[dict]] = None
    
    @validator('phone')
    def normalize_phone(cls, v):
        if v is None:
            return v
        
        # Same normalization as in CustomerBase
        digits = ''.join(filter(str.isdigit, v))
        
        if digits.startswith('7') and len(digits) == 11:
            return f"+{digits}"
        elif digits.startswith('8') and len(digits) == 11:
            return f"+7{digits[1:]}"
        elif len(digits) == 10:
            return f"+7{digits}"
        
        return v


class Customer(CustomerBase):
    id: int
    orders_count: int
    total_spent: float
    last_order_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    addresses: List[CustomerAddress] = []
    important_dates: List[CustomerImportantDate] = []
    
    # Computed properties
    primary_address: Optional[CustomerAddress] = None
    rfm_score: dict

    class Config:
        from_attributes = True


class CustomerMergeRequest(BaseModel):
    keep_customer_id: int
    merge_customer_id: int
    
    @validator('merge_customer_id')
    def validate_different_ids(cls, v, values):
        if 'keep_customer_id' in values and v == values['keep_customer_id']:
            raise ValueError("Cannot merge customer with itself")
        return v