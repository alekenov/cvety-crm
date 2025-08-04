from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.decorative_material import DecorativeMaterial, CalculatorSettings
from app.schemas.decorative_material import (
    DecorativeMaterialCreate,
    DecorativeMaterialUpdate,
    CalculatorSettingsCreate,
    CalculatorSettingsUpdate
)


class CRUDDecorativeMaterial:
    def get(self, db: Session, id: int, shop_id: int) -> Optional[DecorativeMaterial]:
        return db.query(DecorativeMaterial).filter(
            and_(
                DecorativeMaterial.id == id,
                DecorativeMaterial.shop_id == shop_id
            )
        ).first()
    
    def get_multi(
        self,
        db: Session,
        shop_id: int,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[DecorativeMaterial], int]:
        query = db.query(DecorativeMaterial).filter(
            DecorativeMaterial.shop_id == shop_id
        )
        
        if category:
            query = query.filter(DecorativeMaterial.category == category)
        
        if is_active is not None:
            query = query.filter(DecorativeMaterial.is_active == is_active)
        
        total = query.count()
        items = query.order_by(DecorativeMaterial.name).offset(skip).limit(limit).all()
        
        return items, total
    
    def create(
        self,
        db: Session,
        obj_in: DecorativeMaterialCreate,
        shop_id: int
    ) -> DecorativeMaterial:
        db_obj = DecorativeMaterial(
            shop_id=shop_id,
            **obj_in.dict()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        db_obj: DecorativeMaterial,
        obj_in: DecorativeMaterialUpdate
    ) -> DecorativeMaterial:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, id: int, shop_id: int) -> bool:
        obj = self.get(db, id=id, shop_id=shop_id)
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False


class CRUDCalculatorSettings:
    def get_or_create(
        self,
        db: Session,
        shop_id: int
    ) -> CalculatorSettings:
        settings = db.query(CalculatorSettings).filter(
            CalculatorSettings.shop_id == shop_id
        ).first()
        
        if not settings:
            settings = CalculatorSettings(shop_id=shop_id)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return settings
    
    def update(
        self,
        db: Session,
        shop_id: int,
        obj_in: CalculatorSettingsUpdate
    ) -> CalculatorSettings:
        settings = self.get_or_create(db, shop_id=shop_id)
        
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings


decorative_material = CRUDDecorativeMaterial()
calculator_settings = CRUDCalculatorSettings()