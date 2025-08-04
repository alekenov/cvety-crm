# Процедуры безопасного изменения схемы базы данных

Этот документ содержит пошаговые инструкции для предотвращения потери данных при изменениях схемы БД.

## ⚠️ Важно: НИКОГДА не удаляйте базу данных!

**НЕ ДЕЛАЙТЕ ЭТО:**
```bash
rm -f backend/flower_shop.db  # ❌ ОПАСНО! Теряем все данные
```

**ВМЕСТО ЭТОГО используйте миграции Alembic**

## Пошаговая процедура изменения схемы

### 1. Создайте резервную копию
```bash
make db-backup
```
Это создаст файл `backups/flower_shop_YYYYMMDD_HHMMSS.db`

### 2. Проверьте текущее состояние схемы
```bash
make db-validate-schema
```

### 3. Внесите изменения в модели SQLAlchemy
Измените файлы в `backend/app/models/`

### 4. Обновите соответствующие Pydantic схемы
Измените файлы в `backend/app/schemas/`

### 5. Создайте миграцию Alembic
```bash
make db-revision msg="описание изменений"
```

### 6. Протестируйте в staging окружении
```bash
make test-schema-changes
```
Это запустит staging среду на порту 8001

### 7. Примените миграцию в dev
```bash
make db-migrate
```

### 8. Запустите тесты валидации схемы
```bash
cd backend && python -m pytest tests/test_schema_validation.py -v
```

### 9. В случае проблем - откатите
```bash
make db-rollback
# или восстановите из backup
make db-restore file=backups/flower_shop_YYYYMMDD_HHMMSS.db
```

## Типичные сценарии изменений

### Переименование поля
```python
# 1. Создайте миграцию для добавления нового поля
# 2. Скопируйте данные из старого поля в новое
# 3. Обновите код для использования нового поля
# 4. Создайте миграцию для удаления старого поля
```

### Изменение типа поля
```python
# 1. Добавьте новое поле с новым типом
# 2. Мигрируйте данные с конвертацией типов
# 3. Обновите код
# 4. Удалите старое поле
```

### Добавление NOT NULL поля
```python
# 1. Добавьте поле как nullable
# 2. Заполните данные для существующих записей
# 3. Измените поле на NOT NULL
```

## Проверки перед продакшеном

1. ✅ Резервная копия создана
2. ✅ Staging тесты прошли успешно
3. ✅ Тесты валидации схемы прошли
4. ✅ Миграция протестирована на копии продакшен данных
5. ✅ План отката готов

## Команды для управления БД

### Основные команды
- `make db-backup` - создать backup
- `make db-restore file=path` - восстановить из backup
- `make db-migrate` - применить миграции
- `make db-rollback` - откатить последнюю миграцию
- `make db-revision msg="text"` - создать новую миграцию

### Staging окружение
- `make staging-up` - запустить staging на порту 8001
- `make staging-down` - остановить staging
- `make test-schema-changes` - протестировать изменения

### Проверки
- `make db-validate-schema` - проверить схему
- `make db-list-backups` - показать все backup'ы

## Troubleshooting

### "No module named 'app'"
```bash
cd backend && python -m pytest tests/
```

### "Schema validation failed"
1. Проверьте соответствие полей в model и schema
2. Убедитесь что field types совпадают
3. Проверьте required/optional поля

### "Migration failed" 
1. Откатите миграцию: `make db-rollback`
2. Исправьте модель
3. Создайте новую миграцию
4. Или восстановите из backup: `make db-restore file=...`

## Корневая причина проблемы с retail_price

**Что произошло:**
1. Pydantic схема ожидала поле `retail_price`
2. SQLAlchemy модель имела поле `price`
3. При попытке исправить это, была удалена вся БД
4. Все данные (заказы, клиенты, статистика) были потеряны

**Как это предотвратить:**
1. Использовать миграции вместо удаления БД
2. Тестировать в staging окружении
3. Проверять схемы тестами
4. Создавать backup'ы перед изменениями

## Пример правильного исправления поля price → retail_price

```bash
# 1. Backup
make db-backup

# 2. Создать миграцию для переименования
make db-revision msg="rename price to retail_price in products"

# 3. Отредактировать созданную миграцию для переименования колонки
# backend/alembic/versions/XXX_rename_price_to_retail_price.py

# 4. Обновить Pydantic схему
# backend/app/schemas/product.py

# 5. Применить миграцию
make db-migrate

# 6. Тестировать
cd backend && python -m pytest tests/test_schema_validation.py
```

**НИКОГДА НЕ ДЕЛАЙТЕ:**
```bash
rm -f backend/flower_shop.db  # ❌ Потеря всех данных!
```

**ВСЕГДА ДЕЛАЙТЕ:**
```bash
make db-backup && make db-revision msg="..." && make db-migrate  # ✅ Безопасно
```