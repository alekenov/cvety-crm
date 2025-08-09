# 🚀 Быстрый деплой Telegram Mini App

## Вариант 1: Через Railway Dashboard (РЕКОМЕНДУЕТСЯ)

1. **Откройте Railway Dashboard**
   https://railway.app/dashboard

2. **Создайте НОВЫЙ проект**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий `shadcn-test`

3. **Настройте сервис**
   - **Root Directory**: `telegram-miniapp`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://cvety-kz-production.up.railway.app
     PORT=8080
     ```

4. **Дождитесь деплоя**
   - Railway автоматически обнаружит Vite приложение
   - Сборка займет 2-3 минуты

5. **Получите URL**
   - После деплоя нажмите на сервис
   - В Settings → Domains → Generate Domain
   - Получите URL вида: `https://telegram-miniapp-production-xxxx.up.railway.app`

## Вариант 2: Vercel (Альтернатива - еще проще!)

1. **Установите Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **В директории telegram-miniapp**
   ```bash
   cd telegram-miniapp
   vercel
   ```

3. **Ответьте на вопросы**
   - Set up and deploy? **Y**
   - Which scope? Выберите ваш аккаунт
   - Link to existing project? **N**
   - Project name? **telegram-miniapp**
   - Directory? **./** (текущая)
   - Want to override settings? **N**

4. **Установите переменные**
   ```bash
   vercel env add VITE_API_URL
   # Введите: https://cvety-kz-production.up.railway.app
   ```

5. **Деплой в production**
   ```bash
   vercel --prod
   ```

## После деплоя - настройка бота

Обновите URL в `setup-bot.py`:
```python
MINI_APP_URL = "ВАШ_НОВЫЙ_URL_ОТ_RAILWAY_ИЛИ_VERCEL"
```

Запустите:
```bash
python3 setup-bot.py
```

## Проверка
1. Откройте @HHFlorBot в Telegram
2. Нажмите кнопку меню
3. Mini App должен открыться!