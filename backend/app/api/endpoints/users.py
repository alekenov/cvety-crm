from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app import crud
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import UserRole
from app.models.shop import Shop

router = APIRouter()


@router.get("/", response_model=List[User])
def get_users(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None
):
    """Get list of users, optionally filtered by role"""
    if role:
        users = crud.user.get_by_role(db, role=role, skip=skip, limit=limit)
    else:
        users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.get("/florists", response_model=List[User])
def get_florists(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Get list of active florists"""
    return crud.user.get_florists(db)


@router.get("/couriers", response_model=List[User])
def get_couriers(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Get list of active couriers"""
    return crud.user.get_couriers(db)


@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Get user by ID"""
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=User)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Create new user"""
    # Check if user with email already exists
    if user_in.email:
        user = crud.user.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
    
    # Check if user with phone already exists
    user = crud.user.get_by_phone(db, phone=user_in.phone)
    if user:
        raise HTTPException(
            status_code=400,
            detail="User with this phone already exists"
        )
    
    user = crud.user.create(db, obj_in=user_in)
    return user


@router.patch("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Update user"""
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = crud.user.update(db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/{user_id}", response_model=User)
def deactivate_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)
):
    """Deactivate user (soft delete)"""
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = crud.user.deactivate(db, db_obj=user)
    return user