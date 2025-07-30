from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=schemas.CompanySettings)
def read_settings(
    db: Session = Depends(deps.get_db)
):
    """
    Получить текущие настройки компании.
    """
    return crud.settings.get_or_create(db=db)


@router.patch("/", response_model=schemas.CompanySettings)
def update_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: schemas.CompanySettingsUpdate
):
    """
    Обновить настройки компании.
    """
    return crud.settings.update_settings(db=db, obj_in=settings_in)


@router.get("/delivery-zones")
def get_delivery_zones(
    db: Session = Depends(deps.get_db)
):
    """
    Получить список зон доставки с ценами.
    """
    settings = crud.settings.get_or_create(db=db)
    return {
        "items": settings.delivery_zones,
        "total": len(settings.delivery_zones)
    }


@router.post("/delivery-zones", status_code=201)
def add_delivery_zone(
    *,
    db: Session = Depends(deps.get_db),
    zone: schemas.DeliveryZone
):
    """
    Добавить новую зону доставки.
    """
    settings = crud.settings.get_or_create(db=db)
    zones = settings.delivery_zones.copy()
    zones.append(zone.dict())
    
    update_data = schemas.CompanySettingsUpdate(delivery_zones=zones)
    updated = crud.settings.update_settings(db=db, obj_in=update_data)
    
    return {"message": "Delivery zone added", "zones": updated.delivery_zones}