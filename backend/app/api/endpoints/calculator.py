from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.shop import Shop

router = APIRouter()


# Decorative Materials endpoints
@router.get("/materials", response_model=schemas.DecorativeMaterialList)
def get_decorative_materials(
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """
    Get all decorative materials for the calculator.
    Materials are shop-specific for multi-tenancy.
    """
    items, total = crud.decorative_material.get_multi(
        db=db,
        shop_id=shop.id,
        skip=skip,
        limit=limit,
        category=category,
        is_active=is_active
    )
    
    return {
        "items": items,
        "total": total
    }


@router.get("/materials/{material_id}", response_model=schemas.DecorativeMaterialResponse)
def get_decorative_material(
    material_id: int,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Get a specific decorative material by ID."""
    material = crud.decorative_material.get(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return material


@router.post("/materials", response_model=schemas.DecorativeMaterialResponse, status_code=201)
def create_decorative_material(
    material_in: schemas.DecorativeMaterialCreate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Create a new decorative material."""
    material = crud.decorative_material.create(
        db=db,
        obj_in=material_in,
        shop_id=shop.id
    )
    
    return material


@router.patch("/materials/{material_id}", response_model=schemas.DecorativeMaterialResponse)
def update_decorative_material(
    material_id: int,
    material_in: schemas.DecorativeMaterialUpdate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Update a decorative material."""
    material = crud.decorative_material.get(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    material = crud.decorative_material.update(
        db=db,
        db_obj=material,
        obj_in=material_in
    )
    
    return material


@router.delete("/materials/{material_id}", status_code=204)
def delete_decorative_material(
    material_id: int,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Delete a decorative material."""
    deleted = crud.decorative_material.delete(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return None


# Calculator Settings endpoints
@router.get("/settings", response_model=schemas.CalculatorSettingsResponse)
def get_calculator_settings(
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """
    Get calculator settings for the current shop.
    Creates default settings if none exist.
    """
    settings = crud.calculator_settings.get_or_create(
        db=db,
        shop_id=shop.id
    )
    
    return settings


@router.patch("/settings", response_model=schemas.CalculatorSettingsResponse)
def update_calculator_settings(
    settings_in: schemas.CalculatorSettingsUpdate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Update calculator settings for the current shop."""
    settings = crud.calculator_settings.update(
        db=db,
        shop_id=shop.id,
        obj_in=settings_in
    )
    
    return settings