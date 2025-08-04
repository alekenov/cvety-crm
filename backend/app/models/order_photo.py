from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class PhotoType(str, enum.Enum):
    pre_delivery = "pre_delivery"  # Фото перед доставкой
    completion = "completion"      # Фото после доставки
    process = "process"           # Фото процесса сборки


class CustomerFeedback(str, enum.Enum):
    like = "like"
    dislike = "dislike"


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Photo info
    photo_url = Column(String, nullable=False)  # Path to the uploaded photo
    photo_type = Column(SQLEnum(PhotoType), nullable=False)
    description = Column(Text)  # Optional description from florist
    
    # Upload info
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Customer feedback
    customer_feedback = Column(SQLEnum(CustomerFeedback), nullable=True)  # null, like, dislike
    feedback_comment = Column(Text)  # Optional comment from customer
    feedback_date = Column(DateTime(timezone=True))  # When feedback was given
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="photos")
    uploaded_by = relationship("User", back_populates="uploaded_photos")