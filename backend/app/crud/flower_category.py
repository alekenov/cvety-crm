from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.crud.base import CRUDBase
from app.models.supply import FlowerCategory
from app.schemas.supply import FlowerCategoryCreate, FlowerCategoryUpdate


class CRUDFlowerCategory(CRUDBase[FlowerCategory, FlowerCategoryCreate, FlowerCategoryUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[FlowerCategory]:
        return db.query(FlowerCategory).filter(FlowerCategory.name == name).first()
    
    def detect_category(self, db: Session, *, flower_name: str) -> Optional[FlowerCategory]:
        """
        Auto-detect category based on flower name and keywords
        """
        flower_name_lower = flower_name.lower()
        
        # Get all categories
        categories = db.query(FlowerCategory).all()
        
        for category in categories:
            if category.keywords:
                keywords = [k.strip().lower() for k in category.keywords.split(',')]
                for keyword in keywords:
                    if keyword in flower_name_lower:
                        return category
        
        return None
    
    def get_all_active(self, db: Session) -> List[FlowerCategory]:
        """Get all categories ordered by name"""
        return db.query(FlowerCategory).order_by(FlowerCategory.name).all()


flower_category = CRUDFlowerCategory(FlowerCategory)