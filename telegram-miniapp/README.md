# Cvety.kz Telegram Mini App

Telegram Mini App для управления цветочным магазином. Позволяет просматривать заказы, управлять товарами и получать уведомления прямо в Telegram.

## Возможности

- 📦 **Управление заказами** - просмотр, фильтрация, изменение статусов
- 🛍️ **Каталог товаров** - добавление, редактирование, управление остатками
- 🔔 **Уведомления** - мгновенные оповещения о новых заказах
- 🎨 **Адаптивная тема** - автоматическая подстройка под тему Telegram
- 📱 **Haptic Feedback** - тактильная отдача для лучшего UX

## Технологии

- **React 19** + TypeScript
- **Vite 7** - быстрая сборка
- **Telegram Mini Apps SDK** - интеграция с Telegram
- **Переиспользование компонентов** из основного приложения (shadcn/ui)
- **React Query** - управление серверным состоянием

## Структура проекта

```
telegram-miniapp/
├── src/
│   ├── pages/           # Страницы приложения
│   ├── components/      # Компоненты Mini App
│   ├── services/        # API сервисы
│   ├── adapters/        # Адаптеры для Telegram
│   ├── hooks/          # Custom React hooks
│   └── providers/      # Context providers
├── public/             # Статичные файлы
└── dist/              # Production сборка
```

## Разработка

### Установка зависимостей

```bash
cd telegram-miniapp
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно на http://localhost:5174

### Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```env
VITE_API_URL=http://localhost:8001
VITE_TELEGRAM_BOT_USERNAME=cvety_kz_bot
```

### Сборка для production

```bash
npm run build
```

## Деплой на Railway

### 1. Создание нового проекта

```bash
cd telegram-miniapp
railway init
```

### 2. Настройка переменных окружения

```bash
railway variables set VITE_API_URL=https://your-backend-api.railway.app
railway variables set VITE_TELEGRAM_BOT_USERNAME=cvety_kz_bot
```

### 3. Деплой

```bash
railway up
```

### 4. Получение URL приложения

```bash
railway open
```

## Интеграция с Telegram Bot

### 1. Настройка Mini App в BotFather

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. Нажмите "Bot Settings" → "Menu Button"
4. Введите URL вашего Mini App из Railway
5. Установите название кнопки (например, "Управление магазином")

### 2. Проверка

После настройки в чате с ботом появится кнопка меню, которая открывает Mini App.

## Переиспользование компонентов

Mini App использует компоненты из основного приложения через Vite aliases:

- `@main/components/ui/*` - базовые UI компоненты (Button, Card, Badge и т.д.)
- `@main/lib/utils` - утилиты (cn функция для классов)
- `@main/lib/types` - TypeScript типы
- `@main/components/orders/*` - компоненты заказов
- `@main/components/catalog/*` - компоненты каталога

Это позволяет избежать дублирования кода и обеспечивает единообразие интерфейса.

## API Endpoints

Mini App использует те же API endpoints, что и основное приложение:

- `GET /api/orders` - список заказов
- `PUT /api/orders/:id/status` - изменение статуса заказа
- `GET /api/products` - список товаров
- `PUT /api/products/:id` - обновление товара
- `GET /api/notifications` - список уведомлений

## Особенности для Telegram

### Haptic Feedback

Приложение использует тактильную отдачу для улучшения UX:
- Легкая - при навигации и выборе
- Средняя - при обновлении и важных действиях
- Сильная - при ошибках

### Адаптивная тема

Автоматически подстраивается под текущую тему Telegram:
- Цвета берутся из Telegram Theme
- Поддержка светлой и темной темы
- Плавные переходы при смене темы

### Навигация

- Swipe-жесты для навигации
- Telegram Back Button интегрирован с React Router
- Main Button для основных действий

## Troubleshooting

### Проблема: Mini App не открывается в Telegram

1. Проверьте, что URL правильно настроен в BotFather
2. Убедитесь, что приложение развернуто и доступно по HTTPS
3. Проверьте CORS настройки на backend

### Проблема: Не работает авторизация

1. Проверьте, что VITE_API_URL указывает на правильный backend
2. Убедитесь, что JWT токены корректно сохраняются в localStorage
3. Проверьте CORS заголовки на backend

### Проблема: Не работает haptic feedback

Haptic feedback работает только в официальных клиентах Telegram на мобильных устройствах.

## Поддержка

При возникновении проблем создайте issue в репозитории или свяжитесь с командой разработки.