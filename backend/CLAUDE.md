# Backend - FastAPI Application Memory

## Overview
FastAPI backend для CRM системы цветочного магазина с PostgreSQL, JWT авторизацией и WebSocket поддержкой.

## Directory Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/    # API эндпоинты
│   │   ├── deps.py      # Зависимости (auth, db)
│   │   └── api.py       # Роутер объединение
│   ├── core/            # Конфигурация
│   ├── crud/            # CRUD операции
│   ├── db/              # База данных
│   ├── models/          # SQLAlchemy модели
│   ├── schemas/         # Pydantic схемы
│   ├── services/        # Бизнес-логика
│   └── utils/           # Утилиты
├── alembic/             # Миграции БД
├── tests/               # Тесты
└── uploads/             # Загруженные файлы
```

## Database Models

### Основные модели
- **User**: Пользователи системы (роли: admin, manager, florist, courier)
- **Customer**: Клиенты магазина
- **Order**: Заказы со статусами и историей
- **Product**: Товары каталога
- **WarehouseItem**: Складские позиции
- **Supply**: Поставки товаров
- **ProductionTask**: Задания для флористов
- **Shop**: Магазины для мультитенантности

### Связи
- Order → Customer (многие к одному)
- Order → OrderItem → Product (многие ко многим)
- Order → OrderHistory (один ко многим)
- Product → ProductComponent (для калькулятора)
- ProductionTask → Order, User (флорист)

## API Endpoints Pattern

### Стандартная структура эндпоинта
```python
@router.get("/items", response_model=List[ItemSchema])
async def get_items(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Бизнес-логика
    return crud.get_items(db, skip=skip, limit=limit, search=search)
```

### Авторизация
- JWT токены в headers: `Authorization: Bearer <token>`
- Refresh token для обновления
- OTP через Telegram бот
- Зависимость: `current_user = Depends(get_current_user)`

## CRUD Operations Pattern

### Стандартный CRUD
```python
# В crud/item.py
def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Item).offset(skip).limit(limit).all()

def create_item(db: Session, item: ItemCreate):
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
```

## Pydantic Schemas

### Naming Convention
- `ItemBase` - базовые поля
- `ItemCreate` - для создания
- `ItemUpdate` - для обновления  
- `Item` - для ответа (с id, timestamps)
- `ItemInDB` - полная модель БД

## WebSocket Implementation
```python
# Подключение
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
# Отправка обновлений
await manager.send_personal_message(
    json.dumps({"type": "order_update", "data": order_data}),
    websocket
)
```

## File Upload
- Эндпоинт: `/api/upload/image`
- Сохранение: `backend/uploads/`
- Форматы: jpg, png, webp
- Максимальный размер: 10MB
- Возврат: URL для доступа

## Telegram Bot Integration
- OTP отправка через `/api/telegram/send-otp`
- Верификация через `/api/telegram/verify-otp`
- Токены: 6 цифр, срок жизни 5 минут
- Bot token в переменной окружения

## Testing Approach
```python
# Тестовый клиент
client = TestClient(app)

# Авторизация в тестах
def get_auth_headers():
    response = client.post("/api/auth/login", json={...})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

## Environment Variables
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost/flower_shop
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TELEGRAM_BOT_TOKEN=bot-token
RAILWAY_ENVIRONMENT=development
```

## Database Migrations

### Create new migration
```bash
cd backend
alembic revision --autogenerate -m "Add new field to order"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback
```bash
alembic downgrade -1
```

## Common Queries

### Orders with relations
```python
db.query(Order)\
  .options(joinedload(Order.customer))\
  .options(joinedload(Order.items).joinedload(OrderItem.product))\
  .filter(Order.id == order_id)\
  .first()
```

### Search pattern
```python
if search:
    query = query.filter(
        or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        )
    )
```

## Error Handling
```python
from fastapi import HTTPException

# Стандартные ошибки
raise HTTPException(status_code=404, detail="Item not found")
raise HTTPException(status_code=400, detail="Invalid data")
raise HTTPException(status_code=403, detail="Not enough permissions")
```

## Security Best Practices
- Пароли хешируются через bcrypt
- JWT токены с коротким сроком жизни
- CORS настроен для конкретных origins
- SQL injection защита через SQLAlchemy
- Валидация через Pydantic схемы

## Performance Optimization
- Пагинация по умолчанию (limit=100)
- Lazy loading для отношений
- Индексы на часто используемых полях
- Connection pooling в PostgreSQL

## Debugging Tips
```python
# Логирование SQL запросов
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Отладка в endpoint
import pdb; pdb.set_trace()

# Pretty print для объектов
from pprint import pprint
pprint(order.__dict__)
```

## Deployment Notes
- Dockerfile с multi-stage build
- Автоматические миграции при старте
- Health check endpoint: `/health`
- Статика через Nginx в production
- Gunicorn с uvicorn workers

## Import Local Settings
@~/.claude/backend-local.md