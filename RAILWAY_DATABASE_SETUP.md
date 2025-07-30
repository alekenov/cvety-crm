# 🗄️ Настройка базы данных Railway для Cvety.kz

## Шаг 1: Установка Railway CLI

```bash
# macOS
brew install railway

# Или через npm
npm install -g @railway/cli
```

## Шаг 2: Создание проекта и БД

```bash
# 1. Войдите в Railway
railway login

# 2. Создайте новый проект
railway init

# 3. Добавьте PostgreSQL (в браузере откроется Railway dashboard)
# Нажмите "New" → "Database" → "Add PostgreSQL"
```

## Шаг 3: Получение DATABASE_URL

```bash
# В папке backend выполните:
cd backend

# Получите переменные окружения из Railway
railway variables

# Скопируйте DATABASE_URL и создайте .env файл:
echo "DATABASE_URL=<вставьте сюда DATABASE_URL из Railway>" > .env
echo "SECRET_KEY=your-secret-key-here" >> .env
```

## Шаг 4: Создание таблиц в Railway PostgreSQL

```bash
# Активируйте виртуальное окружение
source venv/bin/activate

# Создайте таблицы используя Alembic
railway run alembic upgrade head

# ИЛИ если alembic не настроен, создайте напрямую:
railway run python -c "
from app.db.base import Base
from app.core.config import settings
from sqlalchemy import create_engine
engine = create_engine(settings.DATABASE_URL)
Base.metadata.create_all(bind=engine)
print('✅ Tables created!')
"
```

## Шаг 5: Загрузка данных

### Вариант А: Импорт из SQLite (если у вас есть данные)

```bash
# Данные уже экспортированы в sqlite_export.json
# Загрузите их в Railway PostgreSQL:
railway run python import_to_postgres.py
```

### Вариант Б: Создание тестовых данных

```bash
# Создайте новые тестовые данные:
railway run python init_database.py
```

## Шаг 6: Проверка данных

```bash
# Проверьте что данные загрузились:
railway run python check_railway_db.py

# Или проверьте вручную:
railway run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    # Проверка таблиц
    result = conn.execute(text(\"\"\"
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    \"\"\"))
    print('📊 Tables:')
    for row in result:
        print(f'  - {row[0]}')
    
    # Проверка данных
    tables = ['customers', 'orders', 'products', 'warehouse_items']
    print('\\n📈 Data counts:')
    for table in tables:
        result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
        print(f'  - {table}: {result.scalar()} records')
"
```

## Шаг 7: Деплой приложения

После успешной настройки БД:

```bash
# Вернитесь в корневую директорию проекта
cd ..

# Задеплойте приложение (CI mode)
railway up -c

# Railway автоматически:
# - Обнаружит railway.toml
# - Соберет Docker образ
# - Запустит приложение
# - Предоставит URL для доступа
```

## 🔍 Полезные команды Railway CLI

```bash
# Просмотр логов
railway logs

# Открыть Railway dashboard
railway open

# Выполнить команду в Railway окружении
railway run <command>

# Просмотр всех переменных окружения
railway variables

# Установка переменной
railway variables set KEY=value

# Подключение к БД через psql
railway connect postgres
```

## ⚠️ Важно!

1. **Не коммитьте .env файл** с реальными credentials
2. **DATABASE_URL от Railway** может начинаться с `postgres://` - наш код автоматически конвертирует в `postgresql://`
3. **Бесплатный план Railway** имеет лимиты - следите за использованием

## 🆘 Если возникли проблемы

1. Убедитесь что Railway CLI установлен: `railway --version`
2. Проверьте что вы в правильной директории (backend для БД команд)
3. Проверьте логи: `railway logs`
4. Убедитесь что PostgreSQL сервис активен в Railway dashboard