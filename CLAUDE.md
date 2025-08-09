# Cvety.kz CRM - Project Memory

## Project Overview
CRM система для управления цветочным магазином с полным циклом от приема заказов до производства и доставки.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + shadcn/ui
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Real-time**: WebSocket для обновлений
- **Auth**: JWT токены + Telegram OTP
- **Deploy**: Railway (PostgreSQL + Docker)

## Project Structure
```
shadcn-test/
├── src/               # Frontend приложение
├── backend/           # FastAPI сервер
├── e2e/              # E2E тесты Playwright
├── docs/             # Документация
└── public/           # Статичные файлы
```

## Key Features
- Управление заказами с историей изменений
- База клиентов с адресами и важными датами
- Каталог товаров с фото и ценами
- Складской учет остатков
- Калькулятор букетов для флористов
- Публичная витрина магазина
- Telegram бот для OTP авторизации

## Development Workflow
```bash
# Запуск всего проекта
npm run dev:all

# Только frontend
npm run dev

# Только backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8001

# Docker compose
docker compose up

# E2E тесты
npm run test:e2e
```

## API Endpoints Base
- Backend: http://localhost:8001
- Frontend: http://localhost:5173
- Витрина: http://localhost:5173/shop/{shopId}
- WebSocket: ws://localhost:8001/ws

## Database
PostgreSQL с миграциями через Alembic:
```bash
cd backend
alembic upgrade head        # Применить миграции
alembic revision --autogenerate -m "description"  # Создать миграцию
```

## Coding Standards

### Общие принципы
- Код и комментарии на русском языке для бизнес-логики
- Технические термины на английском
- Валюта - тенге (₸)
- Часовой пояс - Астана (UTC+6)

### Git Workflow
- Feature branches от main
- Commit messages на английском
- PR с описанием изменений

### Testing
- E2E тесты для критических путей
- Unit тесты для бизнес-логики
- Тестовые данные в init_test_data.py

## Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=your-secret-key
TELEGRAM_BOT_TOKEN=bot-token

# Frontend
VITE_API_URL=http://localhost:8001
```

## Critical Paths
1. Создание заказа → производство → доставка
2. Авторизация через Telegram OTP
3. Калькулятор букетов с компонентами
4. Публичная витрина и корзина

## Known Issues & Solutions
- CORS: настроен для localhost:5173
- WebSocket reconnect: автоматический через useWebSocket hook
- JWT refresh: обработка в axios interceptor
- Файлы загружаются в backend/uploads/

## Imports for Team Members
@~/.claude/personal-settings.md
@./backend/CLAUDE.md
@./src/CLAUDE.md

## Deployment Notes
Railway деплой с автоматическими миграциями:
- Frontend: статичная сборка через Vite
- Backend: Dockerfile с Alembic миграциями
- База: PostgreSQL plugin в Railway

## Contact & Support
- Основной разработчик: @alekenov
- Документация API: /docs (FastAPI автодокументация)
- Мониторинг: Railway dashboard