from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.crud.base import CRUDBase
from app.models.product import Product, ProductImage
from app.models.order import OrderItem
from app.schemas.product import ProductCreate, ProductUpdate


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_active(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        search: Optional[str] = None,
        is_popular: Optional[bool] = None,
        is_new: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        on_sale: Optional[bool] = None
    ) -> List[Product]:
        query = db.query(Product).filter(Product.is_active == True)
        
        # Category filter
        if category:
            query = query.filter(Product.category == category)
        
        # Search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.description.ilike(search_pattern)
                )
            )
        
        # Popular filter
        if is_popular is not None:
            query = query.filter(Product.is_popular == is_popular)
        
        # New filter
        if is_new is not None:
            query = query.filter(Product.is_new == is_new)
        
        # Price filters
        if min_price is not None:
            query = query.filter(
                or_(
                    and_(Product.sale_price.isnot(None), Product.sale_price >= min_price),
                    and_(Product.sale_price.is_(None), Product.retail_price >= min_price)
                )
            )
        
        if max_price is not None:
            query = query.filter(
                or_(
                    and_(Product.sale_price.isnot(None), Product.sale_price <= max_price),
                    and_(Product.sale_price.is_(None), Product.retail_price <= max_price)
                )
            )
        
        # On sale filter
        if on_sale is not None:
            if on_sale:
                query = query.filter(Product.sale_price.isnot(None))
            else:
                query = query.filter(Product.sale_price.is_(None))
        
        return query.offset(skip).limit(limit).all()
    
    def get_with_stats(self, db: Session, *, id: int) -> Optional[Product]:
        product = db.query(Product).filter(Product.id == id).first()
        if product:
            # Calculate order statistics
            stats = db.query(
                func.count(OrderItem.id).label("total_orders"),
                func.sum(OrderItem.total).label("total_revenue")
            ).filter(OrderItem.product_id == id).first()
            
            product.total_orders = stats.total_orders or 0
            product.total_revenue = stats.total_revenue or 0
        
        return product
    
    def create_with_images(
        self,
        db: Session,
        *,
        obj_in: ProductCreate,
        image_urls: Optional[List[str]] = None
    ) -> Product:
        # Create product
        product = self.create(db, obj_in=obj_in)
        
        # Add images if provided
        if image_urls:
            for idx, url in enumerate(image_urls):
                image = ProductImage(
                    product_id=product.id,
                    image_url=url,
                    is_primary=(idx == 0),
                    sort_order=idx
                )
                db.add(image)
            db.commit()
            db.refresh(product)
        
        return product
    
    def update_images(
        self,
        db: Session,
        *,
        product_id: int,
        image_urls: List[str]
    ) -> Product:
        # Delete existing images
        db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
        
        # Add new images
        for idx, url in enumerate(image_urls):
            image = ProductImage(
                product_id=product_id,
                image_url=url,
                is_primary=(idx == 0),
                sort_order=idx
            )
            db.add(image)
        
        db.commit()
        product = db.query(Product).filter(Product.id == product_id).first()
        return product
    
    def toggle_active(self, db: Session, *, id: int) -> Optional[Product]:
        product = self.get(db, id=id)
        if product:
            product.is_active = not product.is_active
            db.commit()
            db.refresh(product)
        return product


product = CRUDProduct(Product)