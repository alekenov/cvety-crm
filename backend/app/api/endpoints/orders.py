from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app import crud
from app.schemas.order import (
    OrderCreate, 
    OrderUpdate, 
    OrderResponse, 
    OrderList,
    OrderStatusUpdate,
    OrderIssueUpdate,
    OrderCreateWithItems,
    OrderResponseWithItems,
    OrderItemResponse,
    OrderItemCreate,
    OrderItemUpdate
)
from app.models.order import OrderStatus

router = APIRouter()


@router.get("/", response_model=OrderList)
def get_orders(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    page: Optional[int] = Query(None, ge=1),
    status: Optional[str] = None,
    search: Optional[str] = None,
    dateFrom: Optional[str] = Query(None, alias="dateFrom"),
    dateTo: Optional[str] = Query(None, alias="dateTo")
):
    # Handle page parameter
    if page:
        skip = (page - 1) * limit
    
    orders = crud.order.get_multi(
        db, skip=skip, limit=limit, 
        status=status, search=search,
        date_from=dateFrom, date_to=dateTo
    )
    # For now, use a simple count - can optimize later
    total_query = db.query(crud.order.model)
    if status and status != "all":
        total_query = total_query.filter(crud.order.model.status == status)
    total = total_query.count()
    
    return {
        "items": [OrderResponse.model_validate(order) for order in orders],
        "total": total
    }


@router.get("/{order_id}", response_model=OrderResponseWithItems)
def get_order(
    order_id: int,
    db: Session = Depends(deps.get_db)
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponseWithItems.model_validate(order)


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    order: OrderCreate,
    db: Session = Depends(deps.get_db)
):
    db_order = crud.order.create(db, obj_in=order)
    return OrderResponse.model_validate(db_order)


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order: OrderUpdate,
    db: Session = Depends(deps.get_db)
):
    existing_order = crud.order.get(db, id=order_id)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order = crud.order.update(db, db_obj=existing_order, obj_in=order)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(db_order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(deps.get_db)
):
    existing_order = crud.order.get(db, id=order_id)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order = crud.order.update_status(
        db, db_obj=existing_order, status=status_update.status
    )
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(db_order)


@router.patch("/{order_id}/issue", response_model=OrderResponse)
def mark_order_issue(
    order_id: int,
    issue_update: OrderIssueUpdate,
    db: Session = Depends(deps.get_db)
):
    existing_order = crud.order.get(db, id=order_id)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order = crud.order.report_issue(
        db, 
        db_obj=existing_order, 
        issue_type=issue_update.issue_type,
        comment=issue_update.comment
    )
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(db_order)


# New endpoint to create order with items
@router.post("/with-items", response_model=OrderResponseWithItems, status_code=201)
def create_order_with_items(
    order: OrderCreateWithItems,
    db: Session = Depends(deps.get_db)
):
    db_order = crud.order.create(db, obj_in=order)
    return OrderResponseWithItems.model_validate(db_order)


# Order Items endpoints
@router.get("/{order_id}/items", response_model=list[OrderItemResponse])
def get_order_items(
    order_id: int,
    db: Session = Depends(deps.get_db)
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    from app.crud.order_item import order_item as crud_order_item
    items = crud_order_item.get_by_order(db, order_id=order_id)
    return items


@router.post("/{order_id}/items", response_model=OrderItemResponse, status_code=201)
def add_order_item(
    order_id: int,
    item: OrderItemCreate,
    db: Session = Depends(deps.get_db)
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    from app.crud.order_item import order_item as crud_order_item
    db_item = crud_order_item.create_for_order(
        db,
        order_id=order_id,
        obj_in=item
    )
    
    # Update order totals
    order.flower_sum = sum(item.total for item in order.items)
    order.total = order.flower_sum + order.delivery_fee
    db.commit()
    
    return db_item


@router.patch("/{order_id}/items/{item_id}", response_model=OrderItemResponse)
def update_order_item(
    order_id: int,
    item_id: int,
    item_update: OrderItemUpdate,
    db: Session = Depends(deps.get_db)
):
    from app.crud.order_item import order_item as crud_order_item
    
    db_item = crud_order_item.get(db, id=item_id)
    if not db_item or db_item.order_id != order_id:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    if item_update.quantity is not None:
        db_item = crud_order_item.update_quantity(
            db,
            db_obj=db_item,
            quantity=item_update.quantity
        )
        
        # Update order totals
        order = crud.order.get(db, id=order_id)
        order.flower_sum = sum(item.total for item in order.items)
        order.total = order.flower_sum + order.delivery_fee
        db.commit()
    
    return db_item


@router.delete("/{order_id}/items/{item_id}")
def delete_order_item(
    order_id: int,
    item_id: int,
    db: Session = Depends(deps.get_db)
):
    from app.crud.order_item import order_item as crud_order_item
    
    db_item = crud_order_item.get(db, id=item_id)
    if not db_item or db_item.order_id != order_id:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    crud_order_item.remove(db, id=item_id)
    
    # Update order totals
    order = crud.order.get(db, id=order_id)
    order.flower_sum = sum(item.total for item in order.items)
    order.total = order.flower_sum + order.delivery_fee
    db.commit()
    
    return {"detail": "Order item deleted"}