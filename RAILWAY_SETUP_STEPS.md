# 🚀 Пошаговая настройка Railway для Cvety.kz

## Шаг 1: Создание проекта в Railway

1. Зайдите на [railway.app](https://railway.app) и создайте аккаунт
2. Нажмите "New Project"
3. НЕ подключайте GitHub сразу, сначала настроим БД

## Шаг 2: Добавление PostgreSQL

1. В новом проекте нажмите "New" → "Database" → "Add PostgreSQL"
2. Дождитесь создания БД (займет ~30 секунд)
3. Кликните на PostgreSQL сервис
4. Перейдите во вкладку "Variables"
5. Скопируйте `DATABASE_URL` (начинается с `postgresql://`)

## Шаг 3: Локальная подготовка данных

1. Обновите локальный `.env` файл с Railway DATABASE_URL:
```bash
cd backend
# Отредактируйте .env и вставьте DATABASE_URL от Railway
nano .env
```

2. Создайте таблицы в Railway PostgreSQL:
```bash
source venv/bin/activate
# Используя Railway DATABASE_URL создаем таблицы
alembic upgrade head
```

3. Загрузите данные из SQLite:
```bash
# Если у вас есть данные в SQLite
python import_to_postgres.py

# ИЛИ создайте новые тестовые данные
python init_database.py
```

## Шаг 4: Проверка данных

```bash
# Проверьте, что данные загрузились
python -c "
from app.core.config import settings
from sqlalchemy import create_engine, text
engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM customers'))
    print(f'Customers: {result.scalar()}')
    result = conn.execute(text('SELECT COUNT(*) FROM orders'))  
    print(f'Orders: {result.scalar()}')
"
```

## Шаг 5: Деплой приложения

1. Вернитесь в Railway dashboard
2. Нажмите "New" → "GitHub Repo"
3. Выберите ваш репозиторий `shadcn-test`
4. Railway автоматически обнаружит `railway.toml` и начнет деплой

## Шаг 6: Настройка переменных окружения

В Railway сервисе (не PostgreSQL):
1. Перейдите в "Variables"
2. Добавьте:
   - `SECRET_KEY` = сгенерируйте безопасный ключ
   - `DATABASE_URL` = будет автоматически из PostgreSQL сервиса
   - Railway автоматически добавит `PORT`

## Шаг 7: Финальная проверка

После успешного деплоя:
1. Откройте URL вашего приложения
2. Проверьте `/health` - должен вернуть `{"status":"healthy"}`
3. Проверьте `/api/health/db` - должен показать подключение к БД
4. Проверьте `/api/orders` - должен вернуть список заказов

## 🔧 Команды для Railway Shell

Если нужно выполнить команды прямо на Railway:

```bash
# Открыть shell в Railway dashboard
railway shell

# Проверить миграции
cd backend
alembic current

# Применить миграции (если не применились)
alembic upgrade head

# Загрузить данные (если БД пустая)
python init_database.py
```

## ⚠️ Важные моменты

1. **НЕ коммитьте** `.env` файл с реальным DATABASE_URL
2. **Используйте** `init_database.py` для создания тестовых данных
3. **Проверьте** что в `config.py` есть обработка `postgres://` → `postgresql://`
4. **Railway бесплатный план** имеет ограничения - следите за использованием

## 🆘 Если что-то пошло не так

1. Проверьте логи в Railway dashboard
2. Убедитесь что DATABASE_URL корректный
3. Проверьте что все зависимости в `requirements.txt`
4. Попробуйте пересоздать БД и повторить процесс