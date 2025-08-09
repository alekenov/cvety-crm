# 🚀 Инструкция по деплою Telegram Mini App на Railway

## Шаг 1: Откройте Railway Dashboard
1. Перейдите на https://railway.app/dashboard
2. Найдите ваш проект **cvety-kz**

## Шаг 2: Добавьте новый сервис
1. В проекте cvety-kz нажмите **"+ New"** → **"GitHub Repo"**
2. Выберите ваш репозиторий
3. В настройках сервиса:
   - Укажите **Root Directory**: `telegram-miniapp`
   - Название сервиса: `telegram-miniapp`

## Шаг 3: Настройте переменные окружения
Добавьте следующие переменные в новом сервисе:

```env
VITE_API_URL=https://cvety-kz-production.up.railway.app
VITE_TELEGRAM_BOT_USERNAME=HHFlorBot
PORT=5173
```

## Шаг 4: Деплой
1. Railway автоматически начнет сборку
2. После завершения вы получите URL вида: `https://telegram-miniapp-production.up.railway.app`

## Шаг 5: Настройте бота
Используйте полученный URL для настройки бота:

```python
python3 setup-bot.py
```

В файле `setup-bot.py` замените:
```python
MINI_APP_URL = "https://telegram-miniapp-production.up.railway.app"
```

## Альтернативный способ через CLI

Если хотите через терминал:

```bash
# 1. В директории telegram-miniapp
cd telegram-miniapp

# 2. Откройте браузер для выбора проекта
railway link

# 3. Выберите:
#    - Workspace: Chingis's Projects
#    - Project: cvety-kz
#    - Environment: production
#    - Service: Create new service

# 4. Установите переменные
railway variables set VITE_API_URL=https://cvety-kz-production.up.railway.app
railway variables set VITE_TELEGRAM_BOT_USERNAME=HHFlorBot

# 5. Деплой
railway up

# 6. Получите URL
railway open
```

## Проверка

После деплоя:
1. Откройте Telegram
2. Найдите @HHFlorBot
3. Нажмите кнопку меню
4. Mini App должен открыться с Railway URL

## Важно!
- Mini App будет подключаться к вашему существующему backend на Railway
- База данных используется та же (PostgreSQL в Railway)
- Авторизация через JWT токены от основного backend