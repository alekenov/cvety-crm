# 🧪 Руководство по тестированию Telegram Mini App

## 1. 🖥️ Локальное тестирование в браузере

### Способ 1: Эмулятор Telegram WebApp
1. Откройте файл `test-telegram.html` в браузере:
   ```bash
   open test-telegram.html
   ```
2. Mini App автоматически загрузится с эмуляцией Telegram API
3. В консоли браузера будут видны все вызовы Telegram API
4. Можно менять тему и данные пользователя

### Способ 2: Прямой доступ
1. Откройте http://localhost:5174 в браузере
2. Приложение работает без Telegram API (fallback режим)
3. Подходит для тестирования UI и базовой функциональности

## 2. 📱 Тестирование на мобильном устройстве

### Через локальную сеть:
1. Узнайте IP адрес вашего компьютера:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Запустите сервер с доступом из сети:
   ```bash
   npm run dev -- --host
   ```
3. Откройте на телефоне: `http://YOUR_IP:5174`

### Через ngrok (рекомендуется):
1. Установите ngrok:
   ```bash
   brew install ngrok
   ```
2. Запустите туннель:
   ```bash
   ngrok http 5174
   ```
3. Используйте полученный HTTPS URL для тестирования

## 3. 🤖 Тестирование в Telegram (Development)

### Создание тестового бота:
1. Откройте @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Получите токен бота

### Настройка Mini App для тестового бота:
1. В @BotFather выберите вашего бота
2. `Bot Settings` → `Menu Button` → `Configure menu button`
3. Введите URL от ngrok (https://xxx.ngrok.io)
4. Установите название кнопки: "Открыть приложение"

### Тестирование:
1. Откройте чат с вашим ботом
2. Нажмите кнопку меню (слева от поля ввода)
3. Mini App откроется в Telegram

## 4. 🚀 Production тестирование через Railway

### Быстрый деплой:
```bash
# В директории telegram-miniapp
railway login
railway init
railway variables set VITE_API_URL=http://localhost:8001
railway up
```

### Получение URL:
```bash
railway open
```

### Настройка в боте:
1. Используйте Railway URL в @BotFather
2. URL должен быть HTTPS (Railway автоматически предоставляет SSL)

## 5. 🛠️ Инструменты для отладки

### Chrome DevTools:
1. Откройте Mini App в Chrome
2. F12 для открытия DevTools
3. Вкладка Console - логи Telegram API
4. Вкладка Network - API запросы
5. Device Mode (Ctrl+Shift+M) - эмуляция мобильного

### Telegram Desktop (Beta):
1. Скачайте Telegram Desktop Beta
2. Settings → Advanced → Experimental settings
3. Включите "Enable webview inspecting"
4. Правый клик на Mini App → Inspect Element

### Логирование:
В коде уже добавлены console.log для всех Telegram API вызовов:
- 📱 Ready state
- 🎨 Theme changes  
- 📳 Haptic feedback
- 💾 CloudStorage operations
- 🔘 Button interactions

## 6. ✅ Чек-лист тестирования

### Основная функциональность:
- [ ] Страница Orders загружается и показывает заказы
- [ ] Фильтрация заказов по статусам работает
- [ ] Pull-to-refresh обновляет данные
- [ ] Страница Products показывает товары
- [ ] Поиск товаров работает
- [ ] Навигация между страницами работает

### Telegram интеграция:
- [ ] Mini App открывается в Telegram
- [ ] Тема соответствует теме Telegram
- [ ] Haptic feedback работает (только на мобильных)
- [ ] CloudStorage сохраняет данные
- [ ] Back button работает корректно

### API интеграция:
- [ ] Авторизация через JWT токен
- [ ] Загрузка данных с backend
- [ ] Обработка ошибок сети
- [ ] Обновление статусов заказов

## 7. 🐛 Частые проблемы и решения

### Mini App не открывается в Telegram:
- Проверьте, что URL начинается с https://
- Убедитесь, что сервер доступен извне
- Проверьте настройки CORS на backend

### Не работает авторизация:
- Проверьте VITE_API_URL в .env
- Убедитесь, что backend запущен
- Проверьте токен в localStorage

### Не работает Haptic Feedback:
- Работает только в мобильных клиентах Telegram
- Не работает в Telegram Desktop
- Не работает в браузере

### Темная тема не применяется:
- Переключите тему в настройках Telegram
- Перезагрузите Mini App
- Проверьте CSS переменные в консоли

## 8. 📊 Мониторинг производительности

### Метрики для проверки:
- Время загрузки < 3 секунд
- Bundle size < 500KB
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

### Проверка в Lighthouse:
1. Откройте Mini App в Chrome
2. DevTools → Lighthouse
3. Выберите "Mobile" и "Performance"
4. Generate report

## Полезные команды

```bash
# Запуск Mini App
npm run dev

# Сборка для production
npm run build

# Предпросмотр production сборки
npm run preview

# Открыть тестовую страницу
open test-telegram.html

# Проверить размер сборки
du -sh dist/

# Запустить с доступом из сети
npm run dev -- --host
```

## Готовые тестовые данные

Для тестирования можно использовать:
- User ID: 123456789
- Username: test_user
- Shop Phone: +77001234567
- API URL: http://localhost:8001

Приложение автоматически создаст тестовые заказы и товары при первом запуске.