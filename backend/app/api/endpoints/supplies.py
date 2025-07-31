from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import crud, schemas
from app.api import deps
from app.models.shop import Shop
from app.utils.supply_parser import parse_supply_text, calculate_retail_price
from app.schemas.supply import (
    Supply, SupplyCreate, SupplyListResponse, SupplyImportPreview,
    FlowerCategory, FlowerCategoryCreate, FlowerCategoryUpdate,
    SupplyItemImport
)

router = APIRouter()


class SupplyParseRequest(BaseModel):
    text: str
    supplier: Optional[str] = None


@router.get("/categories", response_model=List[FlowerCategory])
def read_categories(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
) -> List[FlowerCategory]:
    """
    Get all flower categories with markup percentages.
    """
    return crud.flower_category.get_all_active(db)


@router.post("/categories", response_model=FlowerCategory, status_code=201)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    category_in: FlowerCategoryCreate
) -> FlowerCategory:
    """
    Create new flower category.
    """
    # Check if category with this name already exists
    existing = crud.flower_category.get_by_name(db, name=category_in.name)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category with this name already exists"
        )
    
    return crud.flower_category.create(db=db, obj_in=category_in)


@router.put("/categories/{category_id}", response_model=FlowerCategory)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    category_id: int,
    category_in: FlowerCategoryUpdate
) -> FlowerCategory:
    """
    Update flower category.
    """
    category = crud.flower_category.get(db=db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check name uniqueness if updating name
    if category_in.name and category_in.name != category.name:
        existing = crud.flower_category.get_by_name(db, name=category_in.name)
        if existing and existing.id != category_id:
            raise HTTPException(
                status_code=400,
                detail="Category with this name already exists"
            )
    
    return crud.flower_category.update(db=db, db_obj=category, obj_in=category_in)


@router.post("/parse", response_model=SupplyImportPreview)
def parse_supply_text_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    parse_request: SupplyParseRequest
) -> SupplyImportPreview:
    """
    Parse supply import text and return preview with calculated prices.
    """
    # Parse the text
    items, errors = parse_supply_text(parse_request.text)
    
    # Process each item
    processed_items = []
    total_cost = 0
    
    for item in items:
        # Auto-detect category
        category = crud.flower_category.detect_category(db, flower_name=item.flower_name)
        
        if category:
            item.category_id = category.id
            item.category_name = category.name
            item.retail_price = calculate_retail_price(
                item.purchase_price, 
                category.markup_percentage
            )
        else:
            # Default markup if no category detected
            item.retail_price = calculate_retail_price(item.purchase_price, 100)
        
        total_cost += item.purchase_price * item.quantity
        processed_items.append(item)
    
    return SupplyImportPreview(
        supplier=parse_request.supplier,
        items=processed_items,
        total_cost=total_cost,
        errors=errors
    )


@router.post("/import", response_model=Supply, status_code=201)
def import_supply(
    *,
    db: Session = Depends(deps.get_db),
    current_shop: Shop = Depends(deps.get_current_shop),
    supply_in: SupplyCreate
) -> Supply:
    """
    Import supply with parsed and validated items.
    """
    # Validate that all items have required fields
    if not supply_in.items:
        raise HTTPException(
            status_code=400,
            detail="Supply must have at least one item"
        )
    
    # Create supply with items
    return crud.supply.create_with_items(
        db=db, 
        obj_in=supply_in,
        created_by=current_shop.name  # Track who created the supply
    )


@router.get("/", response_model=SupplyListResponse)
def read_supplies(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> SupplyListResponse:
    """
    Retrieve supplies with optional status filter.
    """
    supplies = crud.supply.get_multi_with_items(
        db, skip=skip, limit=limit, status=status
    )
    
    # Get total count
    query = db.query(crud.supply.model)
    if status:
        query = query.filter(crud.supply.model.status == status)
    total = query.count()
    
    return SupplyListResponse(items=supplies, total=total)


@router.get("/{supply_id}", response_model=Supply)
def read_supply(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    supply_id: int,
) -> Supply:
    """
    Get supply by ID with all items.
    """
    supply = crud.supply.get_with_items(db=db, id=supply_id)
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


@router.put("/{supply_id}/archive", response_model=Supply)
def archive_supply(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    supply_id: int,
) -> Supply:
    """
    Archive a supply (change status to archived).
    """
    supply = crud.supply.update_status(db=db, id=supply_id, status="archived")
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return crud.supply.get_with_items(db=db, id=supply_id)