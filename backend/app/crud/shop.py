from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopUpdate


class CRUDShop:
    def get(self, db: Session, shop_id: int) -> Optional[Shop]:
        return db.query(Shop).filter(Shop.id == shop_id).first()
    
    def get_by_phone(self, db: Session, phone: str) -> Optional[Shop]:
        return db.query(Shop).filter(Shop.phone == phone).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[Shop]:
        return db.query(Shop).filter(Shop.email == email).first()
    
    def get_by_telegram_id(self, db: Session, telegram_id: str) -> Optional[Shop]:
        return db.query(Shop).filter(Shop.telegram_id == telegram_id).first()
    
    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Shop]:
        query = db.query(Shop)
        
        if is_active is not None:
            query = query.filter(Shop.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: ShopCreate) -> Shop:
        db_obj = Shop(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Shop,
        obj_in: ShopUpdate
    ) -> Shop:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_telegram(
        self,
        db: Session,
        *,
        db_obj: Shop,
        telegram_id: str,
        telegram_username: Optional[str] = None
    ) -> Shop:
        db_obj.telegram_id = telegram_id
        if telegram_username:
            db_obj.telegram_username = telegram_username
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_last_login(self, db: Session, *, db_obj: Shop) -> Shop:
        db_obj.last_login_at = datetime.utcnow()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def search(
        self,
        db: Session,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Shop]:
        return db.query(Shop).filter(
            or_(
                Shop.name.ilike(f"%{query}%"),
                Shop.phone.ilike(f"%{query}%"),
                Shop.email.ilike(f"%{query}%"),
                Shop.city.ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit).all()
    
    def delete(self, db: Session, *, shop_id: int) -> Optional[Shop]:
        obj = db.query(Shop).filter(Shop.id == shop_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def deactivate(self, db: Session, *, shop_id: int) -> Optional[Shop]:
        obj = db.query(Shop).filter(Shop.id == shop_id).first()
        if obj:
            obj.is_active = False
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj


shop = CRUDShop()