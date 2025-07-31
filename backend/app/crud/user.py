from typing import Optional, List
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_by_phone(self, db: Session, *, phone: str) -> Optional[User]:
        return db.query(User).filter(User.phone == phone).first()
    
    def get_by_role(self, db: Session, *, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).filter(User.role == role, User.is_active == True).offset(skip).limit(limit).all()
    
    def get_florists(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        return self.get_by_role(db, role=UserRole.florist, skip=skip, limit=limit)
    
    def get_couriers(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        return self.get_by_role(db, role=UserRole.courier, skip=skip, limit=limit)
    
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            phone=obj_in.phone,
            name=obj_in.name,
            email=obj_in.email,
            role=obj_in.role,
            is_active=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        return super().update(db, db_obj=db_obj, obj_in=obj_in)
    
    def deactivate(self, db: Session, *, db_obj: User) -> User:
        db_obj.is_active = False
        db.commit()
        db.refresh(db_obj)
        return db_obj


user = CRUDUser(User)