from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    name = Column(String)
    email = Column(String)
    
    # Statistics
    orders_count = Column(Integer, default=0)
    total_spent = Column(Float, default=0)
    last_order_date = Column(DateTime(timezone=True))
    
    # Additional info
    notes = Column(Text)
    preferences = Column(Text)
    source = Column(String)  # instagram, website, walkin, phone
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="customer")
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")
    important_dates = relationship("CustomerImportantDate", back_populates="customer", cascade="all, delete-orphan")
    
    @property
    def primary_address(self):
        """Get the most recently used address"""
        if self.addresses:
            return sorted(self.addresses, key=lambda x: x.last_used_at or x.created_at, reverse=True)[0]
        return None
    
    @property
    def rfm_score(self):
        """Calculate RFM (Recency, Frequency, Monetary) score"""
        # This is a simplified version - in production you'd want more sophisticated scoring
        recency_score = 5 if self.last_order_date else 1
        frequency_score = min(5, self.orders_count // 3 + 1) if self.orders_count else 1
        monetary_score = min(5, int(self.total_spent / 50000) + 1) if self.total_spent else 1
        
        return {
            "recency": recency_score,
            "frequency": frequency_score,
            "monetary": monetary_score,
            "total": recency_score + frequency_score + monetary_score
        }


class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    address = Column(String, nullable=False)
    label = Column(String)  # Home, Office, etc.
    is_primary = Column(Integer, default=0)  # Using Integer as Boolean for SQLite compatibility
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="addresses")
    
    __table_args__ = (
        UniqueConstraint('customer_id', 'address', name='_customer_address_uc'),
    )


class CustomerImportantDate(Base):
    __tablename__ = "customer_important_dates"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    date = Column(String, nullable=False)  # Format: MM-DD
    description = Column(String, nullable=False)
    
    # Reminders
    remind_days_before = Column(Integer, default=3)
    last_reminded_year = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="important_dates")
    
    __table_args__ = (
        UniqueConstraint('customer_id', 'date', 'description', name='_customer_date_uc'),
    )