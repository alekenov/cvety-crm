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
    OrderDetailResponse,
    OrderItemResponse,
    OrderItemCreate,
    OrderItemUpdate
)
from app.models.order import OrderStatus
from app.models.shop import Shop

router = APIRouter()


@router.get("/", response_model=OrderList)
def get_orders(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth but don't filter by shop yet
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
    
    # Convert orders to response format with related data
    items = []
    for order in orders:
        # First convert basic order data
        order_data = {
            'id': order.id,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'status': order.status,
            'customer_phone': order.customer_phone,
            'recipient_phone': order.recipient_phone,
            'recipient_name': order.recipient_name,
            'address': order.address,
            'delivery_method': order.delivery_method,
            'delivery_window': order.delivery_window,
            'flower_sum': order.flower_sum,
            'delivery_fee': order.delivery_fee,
            'total': order.total,
            'tracking_token': order.tracking_token,
            'has_pre_delivery_photos': order.has_pre_delivery_photos,
            'has_issue': order.has_issue,
            'issue_type': order.issue_type,
            'issue_comment': order.issue_comment,
            'customer_id': order.customer_id,
            'customer': None,
            'assigned_florist': None,
            'assignedTo': None,  # For frontend compatibility
            'items': [
                {
                    'id': item.id,
                    'product_id': item.product_id,
                    'quantity': item.quantity,
                    'price': item.price,
                    'total': item.total,
                    'product_name': item.product.name if item.product else '',
                    'product_category': item.product.category if item.product else ''
                }
                for item in order.items
            ] if order.items else []
        }
        
        # Add customer info
        if order.customer:
            order_data['customer'] = {
                'id': order.customer.id,
                'name': order.customer.name,
                'phone': order.customer.phone,
                'orders_count': order.customer.orders_count,
                'total_spent': order.customer.total_spent
            }
        
        # Add florist info
        if order.assigned_florist:
            florist_data = {
                'id': order.assigned_florist.id,
                'name': order.assigned_florist.name,
                'phone': order.assigned_florist.phone if hasattr(order.assigned_florist, 'phone') else None
            }
            order_data['assigned_florist'] = florist_data
            order_data['assignedTo'] = florist_data  # For frontend compatibility
        else:
            order_data['assigned_florist'] = None
            order_data['assignedTo'] = None
        
        items.append(order_data)
    
    return {
        "items": items,
        "total": total
    }


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build detailed response
    order_dict = OrderDetailResponse.model_validate(order).model_dump()
    
    # Add customer info
    if order.customer:
        order_dict['customer'] = {
            'id': order.customer.id,
            'name': order.customer.name,
            'phone': order.customer.phone,
            'email': order.customer.email,
            'orders_count': order.customer.orders_count,
            'total_spent': order.customer.total_spent
        }
    
    # Add florist info
    if order.assigned_florist:
        order_dict['assigned_florist'] = {
            'id': order.assigned_florist.id,
            'name': order.assigned_florist.name,
            'phone': order.assigned_florist.phone
        }
    
    # Add courier info
    if order.courier:
        order_dict['courier'] = {
            'id': order.courier.id,
            'name': order.courier.name,
            'phone': order.courier.phone
        }
    
    # Add order history
    from app.crud.order_history import order_history as crud_order_history
    history_items = crud_order_history.get_by_order(db, order_id=order_id)
    order_dict['history'] = [
        {
            'id': h.id,
            'event_type': h.event_type.value,
            'old_status': h.old_status,
            'new_status': h.new_status,
            'comment': h.comment,
            'created_at': h.created_at.isoformat(),
            'user': h.user.name if h.user else 'Система'
        }
        for h in history_items
    ]
    
    return order_dict


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


@router.post("/{order_id}/assign-florist")
def assign_florist(
    order_id: int,
    florist_id: int,
    db: Session = Depends(deps.get_db)
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    from app.crud.user import user as crud_user
    florist = crud_user.get(db, id=florist_id)
    if not florist:
        raise HTTPException(status_code=404, detail="Florist not found")
    
    if florist.role != "florist":
        raise HTTPException(status_code=400, detail="User is not a florist")
    
    # Update order
    order.assigned_florist_id = florist_id
    
    # Create history entry
    from app.crud.order_history import order_history as crud_order_history
    crud_order_history.create_florist_assignment(
        db,
        order_id=order_id,
        florist_id=florist_id,
        florist_name=florist.name
    )
    
    db.commit()
    db.refresh(order)
    
    return {"detail": "Florist assigned"}