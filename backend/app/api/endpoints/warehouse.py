from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.warehouse import warehouse
from app.models.shop import Shop
from app.schemas.warehouse import (
    WarehouseItemList,
    WarehouseItemResponse,
    WarehouseItemCreate,
    WarehouseItemUpdate,
    WarehouseFilterParams,
    DeliveryCreate,
    DeliveryResponse,
    DeliveryList,
    WarehouseStats,
    WarehouseMovementList,
    WarehouseMovementResponse,
    StockAdjustmentRequest
)

router = APIRouter()


@router.get("/", response_model=WarehouseItemList)
def get_warehouse_items(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    variety: Optional[str] = None,
    heightCm: Optional[int] = Query(None, alias="heightCm"),
    farm: Optional[str] = None,
    supplier: Optional[str] = None,
    onShowcase: Optional[bool] = Query(None, alias="onShowcase"),
    toWriteOff: Optional[bool] = Query(None, alias="toWriteOff"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100)
):
    """Get warehouse items with filters and pagination"""
    filters = WarehouseFilterParams(
        variety=variety,
        height_cm=heightCm,
        farm=farm,
        supplier=supplier,
        on_showcase=onShowcase,
        to_write_off=toWriteOff,
        search=search,
        page=page,
        limit=limit
    )
    
    items, total = warehouse.get_items(db, filters)
    
    return {
        "items": [WarehouseItemResponse.model_validate(item) for item in items],
        "total": total
    }


@router.get("/stats", response_model=WarehouseStats)
def get_warehouse_stats(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Get warehouse statistics"""
    return warehouse.get_stats(db)


@router.post("/deliveries", response_model=DeliveryResponse, status_code=201)
def create_delivery(
    delivery: DeliveryCreate,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Create new delivery with positions and update warehouse items"""
    try:
        db_delivery = warehouse.create_delivery(db, delivery=delivery)
        return DeliveryResponse.model_validate(db_delivery)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/deliveries", response_model=DeliveryList)
def get_deliveries(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100)
):
    """Get delivery history"""
    deliveries, total = warehouse.get_deliveries(db, skip=skip, limit=limit)
    
    return {
        "items": [DeliveryResponse.model_validate(d) for d in deliveries],
        "total": total
    }


@router.get("/{item_id}", response_model=WarehouseItemResponse)
def get_warehouse_item(
    item_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Get single warehouse item by ID (with auth)"""
    item = warehouse.get_item(db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return WarehouseItemResponse.model_validate(item)


@router.post("/", response_model=WarehouseItemResponse, status_code=201)
def create_warehouse_item(
    item: WarehouseItemCreate,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Create new warehouse item (usually done through deliveries)"""
    db_item = warehouse.create_item(db, item=item)
    return WarehouseItemResponse.model_validate(db_item)


@router.patch("/{item_id}", response_model=WarehouseItemResponse)
def update_warehouse_item(
    item_id: int,
    item_update: WarehouseItemUpdate,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Update warehouse item (price, quantity, flags)"""
    # Add user tracking if auth is implemented
    # current_user = get_current_user()
    # item_update.updated_by = current_user.email
    
    db_item = warehouse.update_item(db, item_id=item_id, item_update=item_update)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return WarehouseItemResponse.model_validate(db_item)


# Movement endpoints
@router.get("/{item_id}/movements", response_model=WarehouseMovementList)
def get_warehouse_item_movements(
    item_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    """Get movement history for a warehouse item"""
    movements, total = warehouse.get_movements(db, warehouse_item_id=item_id, skip=skip, limit=limit)
    
    return {
        "items": [WarehouseMovementResponse.model_validate(m) for m in movements],
        "total": total
    }


@router.post("/{item_id}/adjust-stock", response_model=WarehouseMovementResponse)
def adjust_warehouse_item_stock(
    item_id: int,
    adjustment: StockAdjustmentRequest,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """Adjust stock quantity and create movement record"""
    try:
        movement = warehouse.adjust_stock(db, warehouse_item_id=item_id, adjustment_request=adjustment)
        return WarehouseMovementResponse.model_validate(movement)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))