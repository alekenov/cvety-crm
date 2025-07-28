from fastapi import APIRouter

from app.api.endpoints import orders, tracking, warehouse, products, customers, production, settings, init_data

api_router = APIRouter()

api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(warehouse.router, prefix="/warehouse", tags=["warehouse"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(init_data.router, prefix="/init", tags=["initialization"])