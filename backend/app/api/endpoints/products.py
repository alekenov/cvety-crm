from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_popular: Optional[bool] = None,
    is_new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    on_sale: Optional[bool] = None
):
    """
    Retrieve products with optional filters.
    """
    products = crud.product.get_active(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        search=search,
        is_popular=is_popular,
        is_new=is_new,
        min_price=min_price,
        max_price=max_price,
        on_sale=on_sale
    )
    
    # Get total count of products with filters applied
    try:
        total = crud.product.count_active(
            db=db,
            category=category,
            search=search,
            is_popular=is_popular,
            is_new=is_new,
            min_price=min_price,
            max_price=max_price,
            on_sale=on_sale
        )
    except AttributeError:
        # Fallback if count_active is not available
        total = len(products)
    
    # Convert SQLAlchemy models to Pydantic schemas
    product_schemas = [schemas.Product.from_orm(product) for product in products]
    
    # Return in expected format with items and total
    return {
        "items": product_schemas,
        "total": total
    }


@router.post("/", response_model=schemas.Product, status_code=201)
def create_product(
    *,
    db: Session = Depends(deps.get_db),
    product_in: schemas.ProductCreate
) -> schemas.Product:
    """
    Create new product.
    """
    product = crud.product.create(db=db, obj_in=product_in)
    return product


@router.get("/{id}", response_model=schemas.ProductWithStats)
def read_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> schemas.ProductWithStats:
    """
    Get product by ID with order statistics.
    """
    product = crud.product.get_with_stats(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{id}", response_model=schemas.Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    product_in: schemas.ProductUpdate,
) -> schemas.Product:
    """
    Update a product.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = crud.product.update(db=db, db_obj=product, obj_in=product_in)
    return product


@router.post("/{id}/toggle-active", response_model=schemas.Product, status_code=201)
def toggle_product_active(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> schemas.Product:
    """
    Toggle product active status.
    """
    product = crud.product.toggle_active(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{id}/images", response_model=schemas.Product)
def update_product_images(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    image_urls: List[str]
) -> schemas.Product:
    """
    Update product images.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = crud.product.update_images(db=db, product_id=id, image_urls=image_urls)
    return product


@router.delete("/{id}", response_model=schemas.Product)
def delete_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> schemas.Product:
    """
    Delete a product.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = crud.product.remove(db=db, id=id)
    return product