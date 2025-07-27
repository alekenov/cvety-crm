from typing import Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.settings import CompanySettings
from app.schemas.settings import CompanySettingsCreate, CompanySettingsUpdate


class CRUDSettings(CRUDBase[CompanySettings, CompanySettingsCreate, CompanySettingsUpdate]):
    def get_or_create(self, db: Session) -> CompanySettings:
        """
        Получить настройки компании или создать дефолтные.
        Всегда возвращает единственную запись (singleton).
        """
        settings = db.query(self.model).first()
        if not settings:
            # Создаем дефолтные настройки
            default_settings = CompanySettingsCreate(
                name="Cvety.kz",
                address="г. Алматы, пр. Достык 89, офис 301",
                email="info@cvety.kz",
                phones=["+7 (700) 123-45-67", "+7 (727) 123-45-67"],
                working_hours={"from": "09:00", "to": "20:00"},
                delivery_zones=[
                    {"name": "Центр города", "price": 2000},
                    {"name": "Алмалинский район", "price": 2500},
                    {"name": "Бостандыкский район", "price": 2500},
                    {"name": "Медеуский район", "price": 3000},
                    {"name": "Наурызбайский район", "price": 3500},
                    {"name": "За городом", "price": 5000}
                ]
            )
            settings = self.create(db=db, obj_in=default_settings)
        return settings
    
    def update_settings(
        self, db: Session, *, obj_in: CompanySettingsUpdate
    ) -> CompanySettings:
        """
        Обновить настройки компании.
        """
        settings = self.get_or_create(db=db)
        return self.update(db=db, db_obj=settings, obj_in=obj_in)


settings = CRUDSettings(CompanySettings)