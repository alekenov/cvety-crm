from fastapi import APIRouter

from app.api.endpoints import orders, tracking, warehouse, products, customers, production, settings, init_data, auth, telegram, supplies, upload, users, comments, public

api_router = APIRouter()

# Public routes (no auth required)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
api_router.include_router(public.router, prefix="/public", tags=["public"])

# Protected routes (require auth)
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(warehouse.router, prefix="/warehouse", tags=["warehouse"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(supplies.router, prefix="/supplies", tags=["supplies"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(init_data.router, prefix="/init", tags=["initialization"])