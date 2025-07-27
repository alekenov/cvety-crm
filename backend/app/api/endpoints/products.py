from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.Product])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    is_popular: Optional[bool] = Query(None, description="Filter by popular flag"),
    is_new: Optional[bool] = Query(None, description="Filter by new flag"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    on_sale: Optional[bool] = Query(None, description="Filter products on sale")
) -> List[schemas.Product]:
    """
    Retrieve products with optional filters.
    """
    products = crud.product.get_active(
        db,
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
    return products


@router.post("/", response_model=schemas.Product)
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


@router.post("/{id}/toggle-active", response_model=schemas.Product)
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