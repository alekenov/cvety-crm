"""Public shop endpoints for storefront"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, distinct

from app.api import deps
from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.customer import Customer
from app.schemas.shop_public import (
    ShopPublicInfo,
    ShopProductsResponse,
    ShopCategoriesResponse,
    ShopOrderCreate,
    ShopOrderResponse
)
import secrets
from datetime import datetime

router = APIRouter()


@router.get("/shops/{shop_id}", response_model=ShopPublicInfo)
def get_shop_info(
    shop_id: int,
    db: Session = Depends(deps.get_db)
) -> Shop:
    """Get public information about a shop with all details."""
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or inactive")
    
    # Calculate average rating from orders (if you have ratings)
    # For now, using mock data
    rating = 4.6
    reviews_count = 827
    
    # Format working hours from JSON to string
    working_hours_str = "Пн-Вс: 8:00 - 22:00"
    if shop.business_hours and isinstance(shop.business_hours, dict):
        # If we have structured hours, format them nicely
        # For now, just use default
        working_hours_str = "Пн-Вс: 8:00 - 22:00"
    
    return ShopPublicInfo(
        id=shop.id,
        name=shop.name,
        description=shop.description or f"Интернет-магазин цветов в {shop.city}",
        phone=shop.phone,
        address=shop.address,
        rating=rating,
        reviews_count=reviews_count,
        delivery_price=2000,  # Default delivery price
        delivery_time="2-4 часа",
        pickup_address=shop.address or "мкр. Самал-2, 111",
        working_hours=working_hours_str,
        instagram=f"@{shop.shop_domain or 'cvety.kz'}",
        whatsapp=shop.whatsapp_number
    )


@router.get("/shops/{shop_id}/products", response_model=ShopProductsResponse)
def get_shop_products(
    shop_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    in_stock: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db)
) -> dict:
    """Get all products for a specific shop with filtering."""
    
    # Verify shop exists and is active
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or inactive")
    
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
    if in_stock is not None:
        if in_stock:
            query = query.filter(Product.stock_quantity > 0)
        else:
            query = query.filter(Product.stock_quantity <= 0)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) |
            (Product.description.ilike(search_pattern))
        )
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    
    # Transform products to API format
    products_list = []
    for product in products:
        # Get main image or use placeholder
        image_url = None
        if product.images:
            image_url = product.images[0].image_url
        elif product.image_url:
            image_url = product.image_url
        
        products_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": int(product.current_price) if product.current_price else 0,
            "category": product.category.value if product.category else None,
            "image_url": image_url,
            "in_stock": True,  # For now, always true since we don't track quantity
            "shop_id": product.shop_id
        })
    
    return ShopProductsResponse(
        products=products_list,
        total=total,
        shop_id=shop_id
    )


@router.get("/shops/{shop_id}/categories", response_model=ShopCategoriesResponse)
def get_shop_categories(
    shop_id: int,
    db: Session = Depends(deps.get_db)
) -> dict:
    """Get all available product categories for a shop."""
    
    # Verify shop exists and is active
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or inactive")
    
    # Get distinct categories with product count
    categories_query = db.query(
        Product.category,
        func.count(Product.id).label('count')
    ).filter(
        Product.shop_id == shop_id,
        Product.is_active == True,
        Product.category.isnot(None)
    ).group_by(Product.category).all()
    
    categories = [
        {
            "name": cat.category,
            "count": cat.count,
            "display_name": cat.category  # You can add translation/formatting here
        }
        for cat in categories_query
    ]
    
    # Add default categories if needed
    default_categories = [
        {"name": "Розы", "count": 24, "display_name": "Розы"},
        {"name": "Тюльпаны", "count": 18, "display_name": "Тюльпаны"},
        {"name": "Пионы", "count": 12, "display_name": "Пионы"},
        {"name": "Хризантемы", "count": 15, "display_name": "Хризантемы"},
        {"name": "Гвоздики", "count": 8, "display_name": "Гвоздики"},
        {"name": "Орхидеи", "count": 6, "display_name": "Орхидеи"},
    ]
    
    # If no categories found, use defaults
    if not categories:
        categories = default_categories
    
    return ShopCategoriesResponse(
        categories=categories,
        total=len(categories)
    )


@router.post("/shops/{shop_id}/orders", response_model=ShopOrderResponse)
def create_shop_order(
    shop_id: int,
    order_data: ShopOrderCreate,
    db: Session = Depends(deps.get_db)
) -> dict:
    """Create a new order for a shop from the storefront."""
    
    # Verify shop exists and is active
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or inactive")
    
    # Find or create customer
    customer = db.query(Customer).filter(
        Customer.phone == order_data.customer_phone,
        Customer.shop_id == shop_id
    ).first()
    
    if not customer:
        customer = Customer(
            name=order_data.customer_name,
            phone=order_data.customer_phone,
            shop_id=shop_id
        )
        db.add(customer)
        db.flush()
    
    # Generate unique tracking token (9 digits)
    tracking_token = str(secrets.randbelow(900000000) + 100000000)
    
    # Create order
    order = Order(
        shop_id=shop_id,
        customer_id=customer.id,
        customer_phone=order_data.customer_phone,
        recipient_name=order_data.recipient_name or order_data.customer_name,
        recipient_phone=order_data.recipient_phone or order_data.customer_phone,
        address=order_data.delivery_address,
        delivery_method=order_data.delivery_type,
        delivery_window={
            "date": order_data.delivery_date,
            "time": order_data.delivery_time
        } if order_data.delivery_date else None,
        delivery_time_text=order_data.delivery_time,
        card_text=order_data.card_text,
        payment_method=order_data.payment_method,
        flower_sum=order_data.total_amount - 2000,  # Subtract delivery fee
        delivery_fee=2000 if order_data.delivery_type == "delivery" else 0,
        total=order_data.total_amount,
        status=OrderStatus.new,
        tracking_token=tracking_token,
        source="storefront"
    )
    db.add(order)
    db.flush()
    
    # Add order items
    for item_data in order_data.items:
        # Verify product exists
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.shop_id == shop_id
        ).first()
        
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Product {item_data.product_id} not found"
            )
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            product_name=item_data.product_name or product.name,
            product_category=product.category.value if product.category else "Other",
            price=item_data.price or product.retail_price,
            quantity=item_data.quantity,
            total=item_data.price * item_data.quantity
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(order)
    
    # Send notification to shop owner (optional)
    # You can add Telegram notification here
    
    return ShopOrderResponse(
        id=order.id,
        tracking_token=order.tracking_token,
        status=order.status.value,
        customer_name=customer.name,
        customer_phone=order.customer_phone,
        total_amount=order.total,
        created_at=order.created_at.isoformat() if order.created_at else datetime.now().isoformat(),
        message="Заказ успешно создан! Сохраните номер для отслеживания."
    )


@router.get("/orders/{tracking_token}", response_model=dict)
def get_order_by_token(
    tracking_token: str,
    db: Session = Depends(deps.get_db)
) -> dict:
    """Get order details by tracking token for public access."""
    
    # Find order by tracking token
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(
        Order.tracking_token == tracking_token
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=404, 
            detail="Заказ не найден. Проверьте правильность номера заказа."
        )
    
    # Get shop info
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    
    # Transform order items
    items = []
    for order_item in order.items:
        item_data = {
            "id": order_item.id,
            "title": order_item.product_name,
            "price": f"{int(order_item.price):,} ₸",
            "quantity": order_item.quantity,
            "image": None
        }
        
        # Try to get product image
        if order_item.product and order_item.product.images:
            item_data["image"] = order_item.product.images[0].image_url
        elif order_item.product and order_item.product.image_url:
            item_data["image"] = order_item.product.image_url
            
        items.append(item_data)
    
    # Get delivery date and time from delivery_window or delivery_time_text
    delivery_date = ""
    delivery_time = ""
    
    if order.delivery_window and isinstance(order.delivery_window, dict):
        delivery_date = order.delivery_window.get("date", "")
        delivery_time = order.delivery_window.get("time", "")
    
    if not delivery_time and order.delivery_time_text:
        delivery_time = order.delivery_time_text
    
    # Map backend status to frontend status
    status_mapping = {
        "new": "preparing",
        "paid": "preparing", 
        "assembled": "ready",
        "delivery": "in_transit",
        "self_pickup": "ready",
        "completed": "delivered",
        "cancelled": "preparing",  # Default fallback
        "issue": "preparing"  # Default fallback
    }
    
    frontend_status = status_mapping.get(order.status.value, "preparing")
    
    # Calculate estimated time based on status
    estimated_time = None
    if frontend_status == "preparing":
        estimated_time = "2-4 часа"
    elif frontend_status == "ready":
        estimated_time = "30-60 минут"
    elif frontend_status == "in_transit":
        estimated_time = "1-2 часа"
    
    # Transform items to CartItem format
    cart_items = []
    for order_item in order.items:
        # Get product image if available
        image_url = ""
        if order_item.product and order_item.product.images:
            image_url = order_item.product.images[0].image_url
        elif order_item.product and order_item.product.image_url:
            image_url = order_item.product.image_url
        
        cart_item = {
            "id": order_item.product_id or order_item.id,
            "title": order_item.product_name,
            "image": image_url,
            "price": f"{int(order_item.price):,} ₸",
            "delivery": "Сегодня к 18:00",  # Default delivery text
            "quantity": order_item.quantity
        }
        cart_items.append(cart_item)
    
    # Transform customerData to CheckoutFormData format
    customer_data = {
        "deliveryMethod": order.delivery_method,
        "deliveryDate": delivery_date,
        "deliveryTime": delivery_time,
        "clarifyWithRecipient": False,
        "customerFirstName": order.customer.name if order.customer else "",
        "customerPhone": order.customer_phone,
        "recipientFirstName": order.recipient_name or "",
        "recipientPhone": order.recipient_phone or "",
        "address": order.address or "",
        "apartment": "",  # Not stored separately in our model
        "paymentMethod": order.payment_method or "cash",
        "cardMessage": order.card_text or "",
        "comments": ""  # Not stored in our model
    }
    
    return {
        "id": str(order.id),
        "orderNumber": order.tracking_token,
        "status": frontend_status,
        "orderDate": order.created_at.strftime("%d.%m.%Y") if order.created_at else "",
        "deliveryDate": delivery_date,
        "deliveryTime": delivery_time,
        "estimatedTime": estimated_time,
        "total": int(order.flower_sum) if order.flower_sum else 0,
        "deliveryFee": int(order.delivery_fee) if order.delivery_fee else 0,
        "deliveryMethod": order.delivery_method,
        "items": cart_items,
        "customerData": customer_data,
        "bouquetPhoto": None,  # Will be added when photo upload is implemented
        "photoRating": None
    }