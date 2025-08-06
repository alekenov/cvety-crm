# 📚 API Documentation Setup Guide

## Обзор созданной документации

### ✅ Что было сделано:

1. **API_DOCUMENTATION.md** - Полная документация API
   - Детальное описание всех эндпоинтов
   - Примеры запросов и ответов
   - Коды ошибок и их обработка
   - Примеры интеграций

2. **Улучшенные OpenAPI аннотации**
   - Добавлены примеры в схемы
   - Улучшены описания эндпоинтов
   - Добавлены response examples

3. **Примеры кода** в `docs/examples/`:
   - `python/client.py` - Python клиент с полным функционалом
   - `javascript/client.js` - JavaScript/TypeScript клиент
   - `telegram-bot/bot.py` - Полноценный Telegram бот

4. **Настройка Docusaurus** для публичного сайта документации

## 🚀 Запуск документации

### Вариант 1: Использование встроенной документации FastAPI

Документация уже доступна:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Вариант 2: Статический сайт с Docusaurus

1. **Установка зависимостей:**
```bash
cd docs-site
npm install @docusaurus/core @docusaurus/preset-classic @docusaurus/theme-mermaid
npm install react react-dom clsx prism-react-renderer
```

2. **Создание структуры документации:**
```bash
mkdir -p docs src/pages src/css src/components
```

3. **Копирование документации:**
```bash
cp ../API_DOCUMENTATION.md docs/api-reference.md
cp -r ../docs/examples docs/
```

4. **Запуск сервера разработки:**
```bash
npm start
# Откроется на http://localhost:3000
```

5. **Сборка для продакшена:**
```bash
npm run build
# Статические файлы будут в папке build/
```

### Вариант 3: GitHub Pages

1. **Создайте репозиторий** `cvety-kz/api-docs`

2. **Деплой на GitHub Pages:**
```bash
cd docs-site
npm run build
npm run deploy
```

3. Документация будет доступна на: https://cvety-kz.github.io/api-docs

### Вариант 4: Vercel/Netlify

1. **Vercel:**
```bash
npx vercel --prod
```

2. **Netlify:**
```bash
npx netlify deploy --prod --dir=build
```

## 📦 Postman коллекция

### Создание из OpenAPI:

1. **Экспорт OpenAPI схемы:**
```bash
curl http://localhost:8000/openapi.json > openapi.json
```

2. **Импорт в Postman:**
- Откройте Postman
- Import → Upload Files → выберите `openapi.json`
- Postman автоматически создаст коллекцию

3. **Настройка переменных:**
```javascript
// В Postman Environment добавьте:
{
  "base_url": "https://api.cvety.kz",
  "token": "{{auth_token}}",
  "phone": "+77011234567"
}
```

4. **Автоматизация авторизации:**
В Pre-request Script коллекции:
```javascript
if (!pm.environment.get("token")) {
    // Request OTP
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/api/auth/request-otp",
        method: 'POST',
        header: {'Content-Type': 'application/json'},
        body: {
            mode: 'raw',
            raw: JSON.stringify({phone: pm.environment.get("phone")})
        }
    });
}
```

## 🎨 Кастомизация документации

### Добавление логотипа:
Поместите логотип в `docs-site/static/img/logo.svg`

### Изменение темы:
Отредактируйте `docs-site/src/css/custom.css`:
```css
:root {
  --ifm-color-primary: #25c997;
  --ifm-color-primary-dark: #21af85;
  --ifm-color-primary-darker: #1fa57c;
  --ifm-color-primary-darkest: #1a8765;
  --ifm-color-primary-light: #29dea9;
  --ifm-color-primary-lighter: #32e1b2;
  --ifm-color-primary-lightest: #4febc2;
}
```

### Добавление интерактивных примеров:
Создайте `docs-site/src/components/ApiPlayground.js`:
```javascript
import React, { useState } from 'react';
import CodeBlock from '@theme/CodeBlock';

export function ApiPlayground() {
  const [response, setResponse] = useState('');
  
  const testApi = async () => {
    const res = await fetch('https://api.cvety.kz/api/tracking/123456789');
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  };
  
  return (
    <div>
      <button onClick={testApi}>Test API</button>
      {response && <CodeBlock language="json">{response}</CodeBlock>}
    </div>
  );
}
```

## 📊 Метрики и аналитика

### Google Analytics:
В `docusaurus.config.js`:
```javascript
gtag: {
  trackingID: 'G-XXXXXXXXXX',
  anonymizeIP: true,
},
```

### Hotjar:
```javascript
scripts: [
  {
    src: 'https://static.hotjar.com/c/hotjar-xxxxx.js?sv=6',
    async: true,
  },
],
```

## 🔍 Поиск в документации

### Algolia DocSearch:
1. Зарегистрируйтесь на https://docsearch.algolia.com/
2. Получите API ключи
3. Обновите `docusaurus.config.js`:
```javascript
algolia: {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_API_KEY',
  indexName: 'cvety_kz_docs',
},
```

## 📝 Следующие шаги

1. **Добавить больше примеров** для каждого языка программирования
2. **Создать видео-туториалы** по основным сценариям
3. **Настроить CI/CD** для автоматического обновления документации
4. **Добавить версионирование** API документации
5. **Создать SDK** для популярных языков
6. **Настроить мониторинг** использования API

## 🆘 Поддержка

- **Email**: dev@cvety.kz
- **Telegram**: @cvety_kz_dev
- **GitHub Issues**: https://github.com/cvety-kz/api/issues

---

*Документация создана: 2025-01-06*