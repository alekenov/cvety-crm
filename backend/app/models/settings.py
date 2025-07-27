from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func

from app.db.session import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Company info
    name = Column(String, nullable=False, default="Cvety.kz")
    address = Column(String, nullable=False, default="г. Алматы, пр. Достык 89, офис 301")
    email = Column(String, nullable=False, default="info@cvety.kz")
    
    # JSON fields
    phones = Column(JSON, nullable=False, default=lambda: ["+7 (700) 123-45-67", "+7 (727) 123-45-67"])
    working_hours = Column(JSON, nullable=False, default=lambda: {"from": "09:00", "to": "20:00"})
    delivery_zones = Column(JSON, nullable=False, default=lambda: [
        {"name": "Центр города", "price": 2000},
        {"name": "Алмалинский район", "price": 2500},
        {"name": "Бостандыкский район", "price": 2500},
        {"name": "Медеуский район", "price": 3000},
        {"name": "Наурызбайский район", "price": 3500},
        {"name": "За городом", "price": 5000}
    ])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())