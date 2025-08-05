from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.crud.base import CRUDBase
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserPermissionsUpdate


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
    
    def get_multi_with_search(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        shop_id: int = 1
    ) -> Tuple[List[User], int]:
        query = db.query(User).filter(User.shop_id == shop_id)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_filter),
                    User.phone.ilike(search_filter),
                    User.email.ilike(search_filter)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        
        return users, total
    
    def create(self, db: Session, *, obj_in: UserCreate, shop_id: int = 1) -> User:
        # Set default permissions based on role
        default_permissions = {
            "orders": False,
            "warehouse": False,
            "customers": False,
            "production": False,
            "settings": False,
            "users": False
        }
        
        if obj_in.role == UserRole.admin:
            # Admin has all permissions
            default_permissions = {k: True for k in default_permissions}
        elif obj_in.role == UserRole.manager:
            # Manager has most permissions except users management
            default_permissions.update({
                "orders": True,
                "warehouse": True,
                "customers": True,
                "production": True,
                "settings": True,
                "users": False
            })
        elif obj_in.role == UserRole.florist:
            # Florist can manage orders and production
            default_permissions.update({
                "orders": True,
                "production": True
            })
        elif obj_in.role == UserRole.courier:
            # Courier can only view orders
            default_permissions.update({
                "orders": True
            })
        
        db_obj = User(
            phone=obj_in.phone,
            name=obj_in.name,
            email=obj_in.email,
            role=obj_in.role,
            is_active=obj_in.is_active,
            telegram_id=obj_in.telegram_id,
            shop_id=shop_id,
            permissions=default_permissions
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        return super().update(db, db_obj=db_obj, obj_in=obj_in)
    
    def update_permissions(
        self,
        db: Session,
        *,
        db_obj: User,
        permissions_update: UserPermissionsUpdate
    ) -> User:
        from sqlalchemy.orm.attributes import flag_modified
        
        # Update permissions
        db_obj.permissions = permissions_update.permissions
        
        # Mark JSON field as modified
        flag_modified(db_obj, "permissions")
        
        # Add to session and commit
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def deactivate(self, db: Session, *, db_obj: User) -> User:
        db_obj.is_active = False
        db.commit()
        db.refresh(db_obj)
        return db_obj


user = CRUDUser(User)