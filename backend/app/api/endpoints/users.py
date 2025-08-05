from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app import crud, schemas
from app.schemas.user import User, UserCreate, UserUpdate, UserList, UserPermissionsUpdate
from app.models.user import UserRole

router = APIRouter()


@router.get("/", response_model=UserList)
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
):
    """
    Retrieve users.
    """
    # For now, we'll use shop authorization and shop_id = 1
    # TODO: Implement proper user authentication
    
    users, total = crud.user.get_multi_with_search(
        db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        is_active=is_active,
        shop_id=current_shop.id
    )
    
    # Debug: Проверяем, что возвращаем правильный формат
    result = UserList(items=users, total=total)
    print(f"Returning UserList with {total} users")
    
    # Temporary: Return dict format to bypass serialization issue
    return {"items": users, "total": total}


@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
) -> Any:
    """
    Create new user.
    """
    # TODO: Implement proper user permissions check
    # For now, all authenticated shops can manage users
    
    # Check if user with this phone already exists
    user = crud.user.get_by_phone(db, phone=user_in.phone)
    if user:
        raise HTTPException(
            status_code=400,
            detail="User with this phone already registered",
        )
    
    # Check if user with this email already exists
    if user_in.email:
        user = crud.user.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already registered",
            )
    
    user = crud.user.create(db, obj_in=user_in, shop_id=current_shop.id)
    return user


@router.get("/{user_id}", response_model=User)
def read_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
) -> Any:
    """
    Get user by ID.
    """
    # TODO: Implement proper user permissions check
    
    user = crud.user.get(db=db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same shop
    if user.shop_id != current_shop.id:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.patch("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
) -> Any:
    """
    Update user.
    """
    # TODO: Implement proper user permissions check
    
    user = crud.user.get(db=db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same shop
    if user.shop_id != current_shop.id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is already taken
    if user_in.email and user_in.email != user.email:
        existing_user = crud.user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists",
            )
    
    user = crud.user.update(db=db, db_obj=user, obj_in=user_in)
    return user


@router.patch("/{user_id}/permissions", response_model=User)
def update_user_permissions(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    permissions_in: UserPermissionsUpdate,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
) -> Any:
    """
    Update user permissions.
    """
    # TODO: Implement proper admin check
    # For now, all authenticated shops can update permissions
    
    user = crud.user.get(db=db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same shop
    if user.shop_id != current_shop.id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot remove admin's permissions
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot modify admin permissions")
    
    user = crud.user.update_permissions(db=db, db_obj=user, permissions_update=permissions_in)
    return user


@router.delete("/{user_id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_shop: schemas.Shop = Depends(deps.get_current_shop),
) -> Any:
    """
    Delete user (deactivate).
    """
    # TODO: Implement proper admin check
    # For now, all authenticated shops can delete users
    
    # TODO: Check if user is deleting themselves
    
    user = crud.user.get(db=db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user belongs to the same shop
    if user.shop_id != current_shop.id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot delete admin users
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    user = crud.user.deactivate(db=db, db_obj=user)
    return user