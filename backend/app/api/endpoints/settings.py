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