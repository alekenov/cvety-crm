from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import crud, schemas
from app.api import deps
from app.models.shop import Shop
from app.models.product import ProductCategory

router = APIRouter()


# Decorative Materials endpoints
@router.get("/materials", response_model=schemas.DecorativeMaterialList)
def get_decorative_materials(
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """
    Get all decorative materials for the calculator.
    Materials are shop-specific for multi-tenancy.
    """
    items, total = crud.decorative_material.get_multi(
        db=db,
        shop_id=shop.id,
        skip=skip,
        limit=limit,
        category=category,
        is_active=is_active
    )
    
    return {
        "items": items,
        "total": total
    }


@router.get("/materials/{material_id}", response_model=schemas.DecorativeMaterialResponse)
def get_decorative_material(
    material_id: int,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Get a specific decorative material by ID."""
    material = crud.decorative_material.get(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return material


@router.post("/materials", response_model=schemas.DecorativeMaterialResponse, status_code=201)
def create_decorative_material(
    material_in: schemas.DecorativeMaterialCreate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Create a new decorative material."""
    material = crud.decorative_material.create(
        db=db,
        obj_in=material_in,
        shop_id=shop.id
    )
    
    return material


@router.patch("/materials/{material_id}", response_model=schemas.DecorativeMaterialResponse)
def update_decorative_material(
    material_id: int,
    material_in: schemas.DecorativeMaterialUpdate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Update a decorative material."""
    material = crud.decorative_material.get(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    material = crud.decorative_material.update(
        db=db,
        db_obj=material,
        obj_in=material_in
    )
    
    return material


@router.delete("/materials/{material_id}", status_code=204)
def delete_decorative_material(
    material_id: int,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Delete a decorative material."""
    deleted = crud.decorative_material.delete(
        db=db,
        id=material_id,
        shop_id=shop.id
    )
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return None


# Calculator Settings endpoints
@router.get("/settings", response_model=schemas.CalculatorSettingsResponse)
def get_calculator_settings(
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """
    Get calculator settings for the current shop.
    Creates default settings if none exist.
    """
    settings = crud.calculator_settings.get_or_create(
        db=db,
        shop_id=shop.id
    )
    
    return settings


@router.patch("/settings", response_model=schemas.CalculatorSettingsResponse)
def update_calculator_settings(
    settings_in: schemas.CalculatorSettingsUpdate,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """Update calculator settings for the current shop."""
    settings = crud.calculator_settings.update(
        db=db,
        shop_id=shop.id,
        obj_in=settings_in
    )
    
    return settings


# Create Product from Calculator endpoint
class BouquetCalculationItem(BaseModel):
    """Single item in bouquet calculation"""
    name: str
    quantity: int
    price: float


class BouquetCalculation(BaseModel):
    """Bouquet calculation data from frontend"""
    flowers: List[BouquetCalculationItem]
    materials: List[BouquetCalculationItem]
    labor_cost: float
    margin_percentage: float
    total_cost: float
    final_price: float


class CreateProductFromCalculator(BaseModel):
    """Request schema for creating product from calculator"""
    calculation: BouquetCalculation
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    category: ProductCategory = ProductCategory.bouquet


@router.post("/create-product", response_model=schemas.Product, status_code=201)
def create_product_from_calculator(
    request: CreateProductFromCalculator,
    db: Session = Depends(deps.get_db),
    shop: Shop = Depends(deps.get_current_shop)
):
    """
    Create a new product from calculator data.
    Auto-generates name and description if not provided.
    Creates detailed product components.
    """
    calc = request.calculation
    
    # Auto-generate product name if not provided
    if not request.product_name:
        flower_names = [item.name for item in calc.flowers]
        if len(flower_names) <= 2:
            product_name = f"Букет из {', '.join(flower_names)}"
        else:
            product_name = f"Букет из {flower_names[0]} и {len(flower_names)-1} других цветов"
    else:
        product_name = request.product_name
    
    # Auto-generate description if not provided
    if not request.product_description:
        flower_details = []
        for item in calc.flowers:
            flower_details.append(f"{item.name} - {item.quantity} шт.")
        
        material_details = []
        for item in calc.materials:
            material_details.append(f"{item.name}")
        
        description_parts = []
        if flower_details:
            description_parts.append(f"Состав: {'; '.join(flower_details)}")
        if material_details:
            description_parts.append(f"Декор: {', '.join(material_details)}")
        
        product_description = ". ".join(description_parts)
    else:
        product_description = request.product_description
    
    # Create product with shop_id
    from app.models.product import Product
    from app.models.product_component import ProductComponent, ComponentType
    
    product = Product(
        name=product_name,
        category=request.category,
        description=product_description,
        cost_price=calc.total_cost,
        retail_price=calc.final_price,
        is_active=True,
        is_new=True,
        shop_id=shop.id
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Create components for flowers
    for flower in calc.flowers:
        component = ProductComponent(
            product_id=product.id,
            component_type=ComponentType.flower,
            name=flower.name,
            description="Основной цветок",
            quantity=flower.quantity,
            unit="шт",
            unit_cost=0,  # We don't have cost info in calculator
            unit_price=flower.price
        )
        db.add(component)
    
    # Create components for materials
    for material in calc.materials:
        component = ProductComponent(
            product_id=product.id,
            component_type=ComponentType.material,
            name=material.name,
            description="Декоративный материал",
            quantity=material.quantity,
            unit="шт",
            unit_cost=0,
            unit_price=material.price
        )
        db.add(component)
    
    # Create component for labor
    if calc.labor_cost > 0:
        component = ProductComponent(
            product_id=product.id,
            component_type=ComponentType.service,
            name="Работа флориста",
            description="Профессиональная сборка букета",
            quantity=1,
            unit="услуга",
            unit_cost=calc.labor_cost,
            unit_price=calc.labor_cost
        )
        db.add(component)
    
    db.commit()
    db.refresh(product)
    
    return product