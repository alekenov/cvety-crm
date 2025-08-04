"""Public endpoints for storefront (no authentication required)"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
import secrets
from datetime import datetime
import asyncio

from app import crud, schemas
from app.api import deps
from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.customer import Customer
from app.services.telegram_service import telegram_service

router = APIRouter()


@router.get("/shops/{shop_id}", response_model=schemas.ShopPublic)
def get_shop_info(
    shop_id: int,
    db: Session = Depends(deps.get_db)
) -> Shop:
    """
    Get public information about a shop.
    No authentication required.
    """
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return shop


@router.get("/products", response_model=schemas.ProductListPublic)
def get_public_products(
    shop_id: int = Query(..., description="Shop ID to filter products"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    db: Session = Depends(deps.get_db)
) -> dict:
    """
    Get public list of products for a specific shop.
    No authentication required.
    """
    # Verify shop exists and is active
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Build query with images relationship
    query = db.query(Product).options(
        joinedload(Product.images)
    ).filter(
        Product.shop_id == shop_id,
        Product.is_active == True
    )
    
    # Apply filters
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": products,
        "total": total
    }


# Create order endpoint
@router.post("/orders", response_model=schemas.PublicOrderResponse)
def create_public_order(
    order_data: schemas.PublicOrderCreate,
    db: Session = Depends(deps.get_db)
) -> Order:
    """
    Create a new order from the storefront.
    No authentication required.
    """
    # Verify shop exists and is active
    shop = db.query(Shop).filter(
        Shop.id == order_data.shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Find or create customer
    customer = db.query(Customer).filter(
        Customer.phone == order_data.customer_phone,
        Customer.shop_id == order_data.shop_id
    ).first()
    
    if not customer:
        customer = Customer(
            phone=order_data.customer_phone,
            name=order_data.recipient_name or "Покупатель",
            shop_id=order_data.shop_id
        )
        db.add(customer)
        db.flush()
    
    # Calculate totals from items
    flower_sum = sum(item.quantity * item.price for item in order_data.items)
    total = flower_sum + order_data.delivery_fee
    
    # Create order
    order = Order(
        customer_id=customer.id,
        customer_phone=order_data.customer_phone,
        recipient_phone=order_data.recipient_phone or order_data.customer_phone,
        recipient_name=order_data.recipient_name,
        address=order_data.address,
        delivery_method=order_data.delivery_method,
        flower_sum=flower_sum,
        delivery_fee=order_data.delivery_fee,
        total=total,
        status=OrderStatus.new,
        shop_id=order_data.shop_id,
        tracking_token=str(secrets.randbelow(900000000) + 100000000),
        card_text=order_data.card_text,
        delivery_time_text=order_data.delivery_time_text,
        source="storefront"
    )
    
    # Handle delivery window
    if order_data.delivery_window:
        order.delivery_window = {
            "from_time": order_data.delivery_window.from_time.isoformat() if order_data.delivery_window.from_time else None,
            "to_time": order_data.delivery_window.to_time.isoformat() if order_data.delivery_window.to_time else None
        }
    
    db.add(order)
    db.flush()
    
    # Create order items
    for item_data in order_data.items:
        # Get product info
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.shop_id == order_data.shop_id
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            product_category=product.category,
            quantity=item_data.quantity,
            price=item_data.price or product.price,
            total=item_data.quantity * (item_data.price or product.price)
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(order)
    
    # Load items for response
    _ = order.items
    
    # Send Telegram notification (simplified for now)
    try:
        print(f"📱 Отправка уведомления о заказе {order.id} (трекинг: {order.tracking_token})")
        # For now, just log the notification - will integrate properly later
        print(f"💰 Заказ на сумму {order.total} ₸")
        print(f"👤 Клиент: {order.recipient_name}")
        print(f"📍 Адрес: {order.address}")
    except Exception as e:
        print(f"❌ Ошибка при подготовке уведомления: {e}")
    
    return order


# Status endpoint  
@router.get("/status/{tracking_token}", response_model=schemas.TrackingResponse)
def get_order_status(
    tracking_token: str,
    db: Session = Depends(deps.get_db)
):
    """
    Get order status information by tracking token.
    No authentication required.
    """
    order = db.query(Order).filter(Order.tracking_token == tracking_token).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Mask sensitive information
    masked_address = order.address
    if masked_address and len(masked_address) > 10:
        parts = masked_address.split()
        if len(parts) > 2:
            # Keep first and last parts, mask middle
            masked_address = f"{parts[0]} {'*' * 5} {parts[-1]}"
    
    masked_phone = None
    if order.recipient_phone:
        # Mask phone number except last 4 digits
        phone = order.recipient_phone
        masked_phone = f"{phone[:6]}****{phone[-2:]}" if len(phone) > 8 else phone
    
    # Load items with product info
    items = []
    for item in order.items:
        items.append({
            "product_name": item.product_name or "Товар",  # Используем product_name из заказа
            "quantity": item.quantity,
            "price": item.price
        })
    
    return schemas.TrackingResponse(
        order_number=order.tracking_token,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        delivery_method=order.delivery_method,
        delivery_window=order.delivery_window,
        delivery_fee=order.delivery_fee,
        total=order.total,
        recipient_name=order.recipient_name,
        recipient_phone=masked_phone,
        address=masked_address,
        items=items,
        tracking_token=tracking_token
    )


async def send_order_notification(order: Order, shop: Shop):
    """Send Telegram notification about new order to shop managers."""
    try:
        # Get shop managers with Telegram ID
        from app.models.user import User
        from app.db.session import SessionLocal
        
        with SessionLocal() as db:
            managers = db.query(User).filter(
                User.shop_id == shop.id,
                User.role.in_(["admin", "manager"]),
                User.telegram_id.isnot(None)
            ).all()
            
            if not managers:
                return
                
            # Format order notification message
            items_text = "\n".join([
                f"• {item.product_name} x{item.quantity} - {int(item.price):,} ₸"
                for item in order.items
            ])
            
            delivery_method = "🚚 Доставка" if order.delivery_method == "delivery" else "🏃 Самовывоз"
            status_emoji = "🆕"
            
            message = f"""
{status_emoji} **Новый заказ в витрине!**

📦 **Заказ:** {order.tracking_token}
🔢 **Трекинг:** {order.tracking_token}
👤 **Клиент:** {order.recipient_name}
📱 **Телефон:** {order.customer_phone}
📍 **Адрес:** {order.address}
{delivery_method}

🛍️ **Состав заказа:**
{items_text}

💰 **Стоимость товаров:** {int(order.flower_sum):,} ₸
🚚 **Доставка:** {int(order.delivery_fee):,} ₸
💳 **Итого:** {int(order.total):,} ₸

🌐 **Источник:** Интернет-витрина
📋 **Статус:** Новый
🔗 **Отследить:** https://cvety.kz/status/{order.tracking_token}

⏰ {order.created_at.strftime('%d.%m.%Y %H:%M')}
"""
            
            # Send to all managers
            for manager in managers:
                try:
                    await telegram_service.send_notification(
                        telegram_id=manager.telegram_id,
                        text=message
                    )
                    print(f"✅ Уведомление отправлено менеджеру {manager.name} (ID: {manager.telegram_id})")
                except Exception as e:
                    print(f"❌ Ошибка отправки уведомления менеджеру {manager.name}: {e}")
                    
    except Exception as e:
        print(f"❌ Ошибка при отправке уведомлений о заказе {order.id}: {e}")