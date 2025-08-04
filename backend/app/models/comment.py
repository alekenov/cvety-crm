from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class AuthorType(str, enum.Enum):
    staff = "staff"      # Comment from florist/manager/admin
    customer = "customer"  # Comment from customer


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for customer comments
    
    # Comment content
    text = Column(Text, nullable=False)
    
    # Author info
    author_type = Column(SQLEnum(AuthorType), nullable=False, default=AuthorType.staff)
    customer_name = Column(String, nullable=True)  # Name for customer comments
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="comments")
    user = relationship("User", back_populates="comments")