# План настройки Database Migrations для Cvety.kz

## 📊 **ТЕКУЩИЙ СТАТУС**

### ✅ Готово:
- Alembic установлен (версия 1.13.1 в `requirements.txt`)
- PostgreSQL настроен через `docker-compose.yml`
- Все модели созданы в `backend/app/models/`
- База данных flower_shop готова

### ❌ Требует выполнения:
- Alembic не инициализирован (директория `backend/alembic/` пустая)
- Миграции не созданы
- Продакшн PostgreSQL не протестирован

## 🔧 **ПЛАН ВЫПОЛНЕНИЯ**

### **Задача 1: Настройка Alembic**

#### 1.1 Инициализация Alembic
```bash
cd backend
source venv/bin/activate
alembic init alembic
```

#### 1.2 Настройка конфигурации
**Файл для редактирования: `backend/alembic.ini`**
```ini
# Заменить строку:
# sqlalchemy.url = driver://user:pass@localhost/dbname
# На:
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/flower_shop

# Или использовать переменную окружения:
# sqlalchemy.url = 
```

#### 1.3 Настройка env.py
**Файл для создания/редактирования: `backend/alembic/env.py`**

Необходимые изменения:
- Импортировать Base из `backend/app/db/session.py`
- Импортировать все модели из `backend/app/models/`
- Настроить target_metadata
- Добавить конфигурацию database URL

**Ссылки на модели для импорта:**
- `backend/app/models/order.py` - Order, OrderItem
- `backend/app/models/customer.py` - Customer, CustomerAddress, CustomerImportantDate
- `backend/app/models/warehouse.py` - WarehouseItem, Delivery, DeliveryPosition
- `backend/app/models/production.py` - FloristTask, TaskItem
- `backend/app/models/product.py` - Product, ProductImage
- `backend/app/models/settings.py` - CompanySettings

#### 1.4 Обновление Base импорта
**Проверить файл: `backend/app/db/base.py`**
Убедиться что все модели импортированы для автодетекта Alembic.

### **Задача 2: Создание начальной миграции**

#### 2.1 Запуск PostgreSQL
```bash
cd backend
docker-compose up -d db
# Дождаться готовности БД (проверить логи)
docker-compose logs db
```

#### 2.2 Генерация автоматической миграции
```bash
alembic revision --autogenerate -m "Initial migration: all models"
```

#### 2.3 Проверка сгенерированной миграции
**Файл для проверки: `backend/alembic/versions/xxx_initial_migration.py`**

Проверить создание таблиц:
- `orders` (связь с `order_items`)
- `customers` (связь с `customer_addresses`, `customer_important_dates`)
- `warehouse_items` (связь с `deliveries`, `delivery_positions`) 
- `florist_tasks` (связь с `task_items`)
- `products` (связь с `product_images`)
- `company_settings`

### **Задача 3: Тестирование миграций**

#### 3.1 Применение миграции
```bash
alembic upgrade head
```

#### 3.2 Проверка структуры БД
```bash
# Подключение к PostgreSQL
docker exec -it $(docker-compose ps -q db) psql -U postgres -d flower_shop

# SQL команды для проверки:
\dt                          # Список таблиц
\d orders                    # Структура таблицы orders
\d customers                 # Структура таблицы customers
\d warehouse_items           # И т.д. для всех таблиц
```

#### 3.3 Тестирование rollback
```bash
alembic downgrade base       # Откат всех миграций
alembic upgrade head         # Повторное применение
```

#### 3.4 Тестирование API с PostgreSQL
**Файлы для тестирования:**
- Запустить backend: `backend/app/main.py`
- Протестировать через curl все API endpoints:
  - `/api/orders/`
  - `/api/customers/`
  - `/api/warehouse/`
  - `/api/production/tasks/`
  - `/api/products/`
  - `/api/settings/`

### **Задача 4: Переключение с SQLite на PostgreSQL**

#### 4.1 Обновление конфигурации
**Файл: `backend/app/core/config.py`**
```python
# Строка 12: убедиться что используется PostgreSQL
DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/flower_shop"
```

#### 4.2 Удаление SQLite файла
```bash
rm backend/flower_shop.db  # Удалить старую SQLite БД
```

#### 4.3 Создание .env файла
**Файл для создания: `backend/.env`**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flower_shop
SECRET_KEY=your-production-secret-key-here
DEBUG=False
```

## 📁 **КЛЮЧЕВЫЕ ФАЙЛЫ ДЛЯ РАБОТЫ**

### Конфигурация:
- `backend/requirements.txt` - зависимости (Alembic уже есть)
- `backend/docker-compose.yml` - PostgreSQL настройки
- `backend/app/core/config.py` - настройки приложения
- `backend/app/db/session.py` - подключение к БД
- `backend/app/db/base.py` - импорт всех моделей

### Модели данных:
- `backend/app/models/order.py`
- `backend/app/models/customer.py` 
- `backend/app/models/warehouse.py`
- `backend/app/models/production.py`
- `backend/app/models/product.py`
- `backend/app/models/settings.py`

### Alembic (будут созданы):
- `backend/alembic.ini` - конфигурация Alembic
- `backend/alembic/env.py` - настройки окружения
- `backend/alembic/versions/` - файлы миграций

## 🎯 **КРИТЕРИИ УСПЕХА**

После выполнения всех задач:
- ✅ Alembic настроен и работает
- ✅ Создана начальная миграция со всеми таблицами
- ✅ PostgreSQL работает с текущими моделями
- ✅ Все API endpoints функционируют с PostgreSQL
- ✅ Возможность создавать новые миграции при изменении моделей
- ✅ Rollback миграций работает корректно

## ⚡ **КОМАНДЫ ДЛЯ БЫСТРОГО СТАРТА**

```bash
# 1. Перейти в backend директорию
cd backend

# 2. Активировать виртуальное окружение
source venv/bin/activate

# 3. Запустить PostgreSQL
docker-compose up -d db

# 4. Инициализировать Alembic
alembic init alembic

# 5. Создать миграцию
alembic revision --autogenerate -m "Initial migration"

# 6. Применить миграцию
alembic upgrade head

# 7. Запустить backend для тестирования
uvicorn app.main:app --reload
```

## 🔍 **ПОЛЕЗНЫЕ КОМАНДЫ**

```bash
# Проверка статуса миграций
alembic current

# Просмотр истории миграций  
alembic history

# Создание пустой миграции
alembic revision -m "Description"

# Применение конкретной миграции
alembic upgrade <revision_id>

# Откат к конкретной миграции
alembic downgrade <revision_id>

# Проверка SQL без применения
alembic upgrade head --sql
```

---

**Автор:** Claude Code Integration  
**Дата:** 2025-07-27  
**Статус:** Готов к выполнению