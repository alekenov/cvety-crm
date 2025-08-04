from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import crud, schemas
from app.api import deps
from app.models.shop import Shop
from app.schemas import product_ingredient

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
def read_products(
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop),  # Require auth
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
    # Filter by shop_id directly in the query
    from app.models.product import Product
    query = db.query(Product).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    )
    
    # Apply additional filters
    if category:
        query = query.filter(Product.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    if is_popular is not None:
        query = query.filter(Product.is_popular == is_popular)
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)
    
    products = query.offset(skip).limit(limit).all()
    
    # Get total count with the same filters
    total_query = db.query(Product).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    )
    
    # Apply same filters for count
    if category:
        total_query = total_query.filter(Product.category == category)
    if search:
        search_pattern = f"%{search}%"
        total_query = total_query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    if is_popular is not None:
        total_query = total_query.filter(Product.is_popular == is_popular)
    if is_new is not None:
        total_query = total_query.filter(Product.is_new == is_new)
    
    total = total_query.count()
    
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
    id: int,
    image_urls: List[str]
) -> schemas.Product:
    """
    Update product images by providing URLs.
    Use /api/upload/images to upload files first, then use the returned URLs here.
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
    _: Shop = Depends(deps.get_current_shop),  # Require auth,
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


@router.get("/{id}/ingredients", response_model=List[product_ingredient.ProductIngredientWithDetails])
def get_product_ingredients(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
):
    """
    Get product ingredients with warehouse item details.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get ingredients with warehouse item details
    from app.models.product_ingredient import ProductIngredient
    from app.models.warehouse import WarehouseItem
    
    ingredients = db.query(ProductIngredient).join(
        WarehouseItem, ProductIngredient.warehouse_item_id == WarehouseItem.id
    ).filter(ProductIngredient.product_id == id).all()
    
    result = []
    for ing in ingredients:
        result.append({
            "id": ing.id,
            "product_id": ing.product_id,
            "warehouse_item_id": ing.warehouse_item_id,
            "quantity": ing.quantity,
            "notes": ing.notes,
            "variety": ing.warehouse_item.variety,
            "height_cm": ing.warehouse_item.height_cm,
            "supplier": ing.warehouse_item.supplier,
            "farm": ing.warehouse_item.farm,
            "available_qty": ing.warehouse_item.available_qty,
            "price": ing.warehouse_item.price
        })
    
    return result


@router.post("/{id}/ingredients", response_model=product_ingredient.ProductIngredient, status_code=201)
def add_product_ingredient(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    ingredient_in: product_ingredient.ProductIngredientCreate
):
    """
    Add ingredient to product.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if warehouse item exists
    from app.models.warehouse import WarehouseItem
    warehouse_item = db.query(WarehouseItem).filter(WarehouseItem.id == ingredient_in.warehouse_item_id).first()
    if not warehouse_item:
        raise HTTPException(status_code=404, detail="Warehouse item not found")
    
    # Check if this ingredient already exists
    from app.models.product_ingredient import ProductIngredient
    existing = db.query(ProductIngredient).filter(
        ProductIngredient.product_id == id,
        ProductIngredient.warehouse_item_id == ingredient_in.warehouse_item_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This ingredient already exists for the product")
    
    # Create ingredient
    db_ingredient = ProductIngredient(
        product_id=id,
        **ingredient_in.dict()
    )
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    
    return db_ingredient


@router.put("/{id}/ingredients/{ingredient_id}", response_model=product_ingredient.ProductIngredient)
def update_product_ingredient(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    ingredient_id: int,
    ingredient_in: product_ingredient.ProductIngredientUpdate
):
    """
    Update product ingredient quantity or notes.
    """
    from app.models.product_ingredient import ProductIngredient
    
    ingredient = db.query(ProductIngredient).filter(
        ProductIngredient.id == ingredient_id,
        ProductIngredient.product_id == id
    ).first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    
    # Update fields
    for field, value in ingredient_in.dict(exclude_unset=True).items():
        setattr(ingredient, field, value)
    
    db.commit()
    db.refresh(ingredient)
    
    return ingredient


@router.delete("/{id}/ingredients/{ingredient_id}")
def remove_product_ingredient(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    ingredient_id: int
):
    """
    Remove ingredient from product.
    """
    from app.models.product_ingredient import ProductIngredient
    
    ingredient = db.query(ProductIngredient).filter(
        ProductIngredient.id == ingredient_id,
        ProductIngredient.product_id == id
    ).first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    
    db.delete(ingredient)
    db.commit()
    
    return {"message": "Ingredient removed successfully"}


# Product Components endpoints
@router.get("/{id}/components", response_model=List[Dict[str, Any]])
def get_product_components(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int
):
    """
    Get all components for a product.
    """
    from app.models.product_component import ProductComponent
    
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    components = db.query(ProductComponent).filter(ProductComponent.product_id == id).all()
    
    result = []
    for comp in components:
        result.append({
            "id": comp.id,
            "product_id": comp.product_id,
            "component_type": comp.component_type.value,
            "name": comp.name,
            "description": comp.description,
            "quantity": comp.quantity,
            "unit": comp.unit,
            "unit_cost": comp.unit_cost,
            "unit_price": comp.unit_price,
            "total_cost": comp.unit_cost * comp.quantity,
            "total_price": comp.unit_price * comp.quantity
        })
    
    return result


@router.post("/{id}/components", response_model=Dict[str, Any], status_code=201)
def add_product_component(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    component_in: Dict[str, Any]
):
    """
    Add component to product.
    """
    product = crud.product.get(db=db, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    from app.models.product_component import ProductComponent, ComponentType
    
    # Create component
    component = ProductComponent(
        product_id=id,
        component_type=ComponentType(component_in["component_type"]),
        name=component_in["name"],
        description=component_in.get("description"),
        quantity=component_in["quantity"],
        unit=component_in.get("unit", "шт"),
        unit_cost=component_in.get("unit_cost", 0),
        unit_price=component_in.get("unit_price", 0)
    )
    
    db.add(component)
    db.commit()
    db.refresh(component)
    
    return {
        "id": component.id,
        "product_id": component.product_id,
        "component_type": component.component_type.value,
        "name": component.name,
        "description": component.description,
        "quantity": component.quantity,
        "unit": component.unit,
        "unit_cost": component.unit_cost,
        "unit_price": component.unit_price,
        "total_cost": component.unit_cost * component.quantity,
        "total_price": component.unit_price * component.quantity
    }


@router.put("/{id}/components/{component_id}", response_model=Dict[str, Any])
def update_product_component(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    component_id: int,
    component_update: Dict[str, Any]
):
    """
    Update product component.
    """
    from app.models.product_component import ProductComponent
    
    component = db.query(ProductComponent).filter(
        ProductComponent.id == component_id,
        ProductComponent.product_id == id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Product component not found")
    
    # Update fields
    for field, value in component_update.items():
        if field == "component_type":
            from app.models.product_component import ComponentType
            setattr(component, field, ComponentType(value))
        else:
            setattr(component, field, value)
    
    db.commit()
    db.refresh(component)
    
    return {
        "id": component.id,
        "product_id": component.product_id,
        "component_type": component.component_type.value,
        "name": component.name,
        "description": component.description,
        "quantity": component.quantity,
        "unit": component.unit,
        "unit_cost": component.unit_cost,
        "unit_price": component.unit_price,
        "total_cost": component.unit_cost * component.quantity,
        "total_price": component.unit_price * component.quantity
    }


@router.delete("/{id}/components/{component_id}")
def delete_product_component(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    id: int,
    component_id: int
):
    """
    Delete product component.
    """
    from app.models.product_component import ProductComponent
    
    component = db.query(ProductComponent).filter(
        ProductComponent.id == component_id,
        ProductComponent.product_id == id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Product component not found")
    
    db.delete(component)
    db.commit()
    
    return {"message": "Component deleted successfully"}