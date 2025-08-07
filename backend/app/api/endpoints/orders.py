from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, cast, String

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
from app.schemas.order_rollback import OrderStatusRollback
from app.models.order import OrderStatus, Order, OrderItem
from app.models.user import User
from app.models.shop import Shop
from pydantic import BaseModel

class PaymentWebhookData(BaseModel):
    payment_method: str = "kaspi"
    payment_id: str = "TEST-PAYMENT-123"
    amount: float = 0
    status: str = "success"

router = APIRouter()


@router.get("/", 
    response_model=OrderList, 
    summary="Get all orders", 
    tags=["orders"],
    responses={
        200: {
            "description": "List of orders retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "items": [{
                            "id": 1234,
                            "status": "paid",
                            "customer_phone": "+77011234567",
                            "recipient_name": "Айгуль",
                            "total": 27000,
                            "tracking_token": "123456789"
                        }],
                        "total": 150
                    }
                }
            }
        },
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"}
    },
    description="""
    Retrieve a paginated list of orders for the current shop.
    
    ## Filters:
    - **status**: Filter by order status (new, paid, assembled, delivery, self_pickup, delivered, completed, issue)
    - **search**: Search by customer phone, recipient phone/name, or order ID
    - **dateFrom/dateTo**: Filter by creation date range (ISO 8601 format)
    
    ## Response includes:
    - Order details with calculated totals
    - Customer information (if linked)
    - Assigned florist details
    - Order items with product information
    
    ## Business Logic:
    - Only returns orders for the authenticated shop
    - Orders sorted by creation date (newest first)
    - Includes related data in single query for performance
    
    ## Example Request:
    ```
    GET /api/orders/?status=paid&page=1&limit=20
    ```
    """)
def get_orders(
    db: Session = Depends(deps.get_db),
    current_shop: Shop = Depends(deps.get_current_shop),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, le=100, description="Maximum number of records to return"),
    page: Optional[int] = Query(None, ge=1, description="Page number (alternative to skip)"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    search: Optional[str] = Query(None, description="Search in phone numbers, names, and order ID"),
    dateFrom: Optional[str] = Query(None, alias="dateFrom", description="Start date for filtering (ISO 8601)"),
    dateTo: Optional[str] = Query(None, alias="dateTo", description="End date for filtering (ISO 8601)")
):
    # Handle page parameter
    if page:
        skip = (page - 1) * limit
    
    # Filter by shop_id
    query = db.query(Order).filter(Order.shop_id == current_shop.id)
    
    if status and status != "all":
        query = query.filter(Order.status == status)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Order.customer_phone.ilike(search_pattern),
                Order.recipient_phone.ilike(search_pattern),
                Order.recipient_name.ilike(search_pattern),
                cast(Order.id, String).ilike(search_pattern)
            )
        )
    
    if dateFrom:
        query = query.filter(Order.created_at >= dateFrom)
    
    if dateTo:
        query = query.filter(Order.created_at <= dateTo)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination and get results
    orders = query.options(
        joinedload(Order.customer),
        joinedload(Order.assigned_florist),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
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
            'payment_method': order.payment_method,
            'payment_date': order.payment_date,
            'customer': None,
            'assigned_florist': None,
            'assignedTo': None,  # For frontend compatibility
            'items': [
                {
                    'id': item.id,
                    'order_id': item.order_id,
                    'product_id': item.product_id,
                    'quantity': item.quantity,
                    'price': item.price,
                    'total': item.total,
                    'product_name': item.product.name if item.product else (item.product_name or 'Товар'),
                    'product_category': item.product.category.value if item.product and hasattr(item.product.category, 'value') else (item.product.category if item.product else (item.product_category or 'other'))
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
    current_shop: Shop = Depends(deps.get_current_shop)
):
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order belongs to current shop
    if order.shop_id != current_shop.id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    
    # Build detailed response manually
    order_dict = {
        'id': order.id,
        'created_at': order.created_at,
        'updated_at': order.updated_at,
        'status': order.status,
        'customer_phone': order.customer_phone,
        'recipient_phone': order.recipient_phone,
        'recipient_name': order.recipient_name,
        'address': order.address,
        'address_needs_clarification': order.address_needs_clarification if hasattr(order, 'address_needs_clarification') else False,
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
        'payment_method': order.payment_method,
        'payment_date': order.payment_date,
        'items': [
            {
                'id': item.id,
                'order_id': item.order_id,
                'product_id': item.product_id,
                'quantity': item.quantity,
                'price': item.price,
                'total': item.total,
                'product_name': item.product.name if item.product else (item.product_name or 'Товар'),
                'product_category': item.product.category.value if item.product and hasattr(item.product.category, 'value') else (item.product.category if item.product else (item.product_category or 'other'))
            }
            for item in order.items
        ] if order.items else []
    }
    
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
    else:
        order_dict['customer'] = None
    
    # Add florist info
    if order.assigned_florist:
        order_dict['assigned_florist'] = {
            'id': order.assigned_florist.id,
            'name': order.assigned_florist.name,
            'phone': order.assigned_florist.phone if hasattr(order.assigned_florist, 'phone') else None
        }
        order_dict['assignedTo'] = order_dict['assigned_florist']  # For frontend compatibility
    else:
        order_dict['assigned_florist'] = None
        order_dict['assignedTo'] = None
    
    # Add courier info
    if order.courier:
        order_dict['courier'] = {
            'id': order.courier.id,
            'name': order.courier.name,
            'phone': order.courier.phone if hasattr(order.courier, 'phone') else None
        }
    else:
        order_dict['courier'] = None
    
    # Add order history
    from app.crud.order_history import order_history as crud_order_history
    history_items = crud_order_history.get_by_order(db, order_id=order_id)
    order_dict['history'] = [
        {
            'id': h.id,
            'event_type': h.event_type.value if hasattr(h.event_type, 'value') else h.event_type,
            'old_status': h.old_status,
            'new_status': h.new_status,
            'comment': h.comment,
            'created_at': h.created_at.isoformat() if h.created_at else None,
            'user': h.user.name if h.user else 'Система'
        }
        for h in history_items
    ]
    
    # Add comments
    from app.crud.comment import comment as crud_comment
    comments = crud_comment.get_by_order(db, order_id=order_id)
    order_dict['comments'] = [
        {
            'id': c.id,
            'text': c.text,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'user': {
                'id': c.user.id,
                'name': c.user.name
            } if c.user else None
        }
        for c in comments
    ]
    
    return order_dict


@router.post("/", response_model=OrderResponse, status_code=201,
    summary="Create new order",
    description="""
    Create a new order for the current shop.
    
    ## Required fields:
    - **customer_phone**: Customer's phone in format +7XXXXXXXXXX
    - **delivery_method**: Either 'delivery' or 'self_pickup'
    - **flower_sum**: Total cost of flowers (in KZT)
    - **total**: Total order amount including delivery
    
    ## Optional fields:
    - **recipient_phone**: If different from customer
    - **recipient_name**: Recipient's name for delivery
    - **address**: Required for delivery method
    - **delivery_window**: Time window with from_time and to_time
    - **delivery_fee**: Delivery cost (0 for self_pickup)
    
    ## Automatic generation:
    - **tracking_token**: Unique token for public tracking
    - **status**: Initially set to 'new'
    - **created_at/updated_at**: Timestamps
    
    ## Business rules:
    - Address is required when delivery_method is 'delivery'
    - Total should equal flower_sum + delivery_fee
    - Phone numbers must be in Kazakhstan format
    """)
def create_order(
    order: OrderCreate,
    db: Session = Depends(deps.get_db),
    current_shop: Shop = Depends(deps.get_current_shop)
):
    db_order = crud.order.create(db, obj_in=order, shop_id=current_shop.id)
    return OrderResponse.model_validate(db_order)


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order: OrderUpdate,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop),
    current_user: User = Depends(deps.get_current_user)
):
    existing_order = crud.order.get(db, id=order_id)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update the order
    db_order = crud.order.update(db, db_obj=existing_order, obj_in=order)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Add history entry for the edit
    from app.crud.order_history import order_history as crud_order_history
    crud_order_history.create(
        db,
        obj_in={
            "order_id": order_id,
            "user_id": current_user.id,  # Now using actual authenticated user
            "event_type": "edited",
            "comment": "Заказ отредактирован"
        }
    )
    
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
    db: Session = Depends(deps.get_db),
    current_shop: Shop = Depends(deps.get_current_shop)
):
    try:
        # Add shop_id to order data
        order_data = order.dict()
        order_data['shop_id'] = current_shop.id
        
        # Calculate totals if not provided
        flower_sum = sum(item['quantity'] * (item.get('price', 0) or 0) for item in order_data.get('items', []))
        order_data['flower_sum'] = flower_sum
        order_data['total'] = flower_sum + order_data.get('delivery_fee', 0)
        
        
        db_order = crud.order.create_with_items(db, order_data=order_data)
        
        # Manually serialize the related objects to dictionaries
        order_dict = {
            'id': db_order.id,
            'order_number': db_order.tracking_token,
            'status': db_order.status,
            'customer_phone': db_order.customer_phone,
            'recipient_phone': db_order.recipient_phone,
            'recipient_name': db_order.recipient_name,
            'address': db_order.address,
            'delivery_method': db_order.delivery_method,
            'payment_method': db_order.payment_method,
            'flower_sum': db_order.flower_sum,
            'delivery_fee': db_order.delivery_fee,
            'total': db_order.total,
            'created_at': db_order.created_at,
            'updated_at': db_order.updated_at,
            'tracking_token': db_order.tracking_token,
            'delivery_window': db_order.delivery_window,
            'customer_id': db_order.customer_id,
            'customer': {
                'id': db_order.customer.id,
                'phone': db_order.customer.phone,
                'name': db_order.customer.name,
                'created_at': db_order.customer.created_at,
                'updated_at': db_order.customer.updated_at
            } if db_order.customer else None,
            'items': [
                {
                    'id': item.id,
                    'order_id': item.order_id,
                    'product_id': item.product_id,
                    'quantity': item.quantity,
                    'price': item.price,
                    'total': item.total,
                    'product_name': item.product.name if item.product else None,
                    'product_category': item.product.category if item.product else None,
                    'product': {
                        'id': item.product.id,
                        'name': item.product.name,
                        'category': item.product.category,
                        'retail_price': item.product.retail_price
                    } if item.product else None
                } for item in db_order.items
            ],
            'assigned_florist': {
                'id': db_order.assigned_florist.id,
                'name': db_order.assigned_florist.name,
                'phone': db_order.assigned_florist.phone
            } if db_order.assigned_florist else None,
            'courier': {
                'id': db_order.courier.id,
                'name': db_order.courier.name,
                'phone': db_order.courier.phone
            } if db_order.courier else None
        }
        
        return OrderResponseWithItems.model_validate(order_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/{order_id}/rollback-status", response_model=OrderResponse)
def rollback_order_status(
    order_id: int,
    rollback: OrderStatusRollback,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop),
    current_user: User = Depends(deps.get_current_user)
):
    """Rollback order status to a previous state"""
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate that we can rollback to this status
    current_status = order.status
    target_status = rollback.target_status
    
    # Define valid rollback paths
    valid_rollbacks = {
        'paid': ['new'],
        'assembled': ['paid', 'new'],
        'delivery': ['assembled', 'paid'],
        'self_pickup': ['assembled', 'paid'],
        'issue': ['new', 'paid', 'assembled', 'delivery', 'self_pickup']
    }
    
    if current_status not in valid_rollbacks:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot rollback from status '{current_status}'"
        )
    
    if target_status not in valid_rollbacks.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot rollback from '{current_status}' to '{target_status}'"
        )
    
    # Update the status
    old_status = order.status
    order.status = target_status
    
    # Create history entry
    from app.crud.order_history import order_history as crud_order_history
    crud_order_history.create(
        db,
        obj_in={
            "order_id": order_id,
            "user_id": current_user.id,  # Now using actual authenticated user
            "event_type": "status_changed",
            "old_status": old_status,
            "new_status": target_status,
            "comment": f"Статус откатен: {rollback.reason}"
        }
    )
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


class CancelOrderRequest(BaseModel):
    cancellation_reason: str

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    request: CancelOrderRequest,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop),
    current_user: User = Depends(deps.get_current_user)
):
    """Cancel an order"""
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order can be cancelled
    if order.status in ['delivery', 'self_pickup']:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel order that is already in delivery or picked up"
        )
    
    # Update status to cancelled (using issue status with special type)
    old_status = order.status
    order.status = OrderStatus.issue
    order.has_issue = True
    order.issue_type = 'other'
    order.issue_comment = f"Заказ отменен: {request.cancellation_reason}"
    
    # Create history entry
    from app.crud.order_history import order_history as crud_order_history
    crud_order_history.create(
        db,
        obj_in={
            "order_id": order_id,
            "user_id": current_user.id,  # Now using actual authenticated user
            "event_type": "status_changed",
            "old_status": old_status,
            "new_status": OrderStatus.issue,
            "comment": f"Заказ отменен: {request.cancellation_reason}"
        }
    )
    
    # Handle inventory rollback for reserved items
    if order.status in [OrderStatus.paid, OrderStatus.assembled]:
        try:
            # Rollback inventory for order items
            for item in order.items:
                if item.product_id:
                    from app.crud.warehouse import warehouse as crud_warehouse
                    # Return the quantity back to warehouse
                    crud_warehouse.adjust_quantity(
                        db,
                        product_id=item.product_id,
                        quantity_change=item.quantity,  # Add back the quantity
                        reason="Order cancellation",
                        user_id=current_user.id
                    )
        except Exception as e:
            # Log the error but don't fail the cancellation
            pass  # In production, this should be logged to monitoring service
    
    # Handle payment refunds if applicable
    if order.status in [OrderStatus.paid, OrderStatus.assembled]:
        try:
            # Create refund record (implementation depends on payment provider)
            # This is a placeholder for future payment integration
            pass  # TODO: Implement specific payment provider refund logic
        except Exception as e:
            # Log the error but don't fail the cancellation
            pass  # In production, this should be logged to monitoring service
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/payment-webhook")
def process_payment_webhook(
    order_id: int,
    payment_data: PaymentWebhookData,
    db: Session = Depends(deps.get_db)
):
    """Test endpoint to simulate payment webhook from payment system"""
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if payment was successful
    if payment_data.status != "success":
        raise HTTPException(status_code=400, detail="Payment failed")
    
    # Update order with payment information
    old_status = order.status
    order.status = OrderStatus.paid
    order.payment_method = payment_data.payment_method
    order.payment_date = datetime.utcnow()
    
    # Create history entry
    from app.crud.order_history import order_history as crud_order_history
    crud_order_history.create(
        db,
        obj_in={
            "order_id": order_id,
            "user_id": None,  # System user (webhook)
            "event_type": "payment_received",
            "old_status": old_status,
            "new_status": OrderStatus.paid,
            "comment": f"Платеж получен через {payment_data.payment_method.upper()}. ID платежа: {payment_data.payment_id}"
        }
    )
    
    db.commit()
    db.refresh(order)
    
    return {
        "status": "success",
        "order_id": order_id,
        "payment_status": "confirmed",
        "order_status": order.status
    }