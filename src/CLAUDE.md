# Frontend - React Application Memory

## Overview
React 19 приложение с TypeScript, shadcn/ui компонентами, Tailwind CSS и Vite сборкой для CRM цветочного магазина.

## Directory Structure
```
src/
├── components/        # Переиспользуемые компоненты
│   ├── ui/           # shadcn/ui базовые компоненты
│   ├── auth/         # Авторизация
│   ├── layout/       # Layout компоненты
│   ├── orders/       # Компоненты заказов
│   ├── catalog/      # Каталог товаров
│   ├── warehouse/    # Складские компоненты
│   └── shared/       # Общие компоненты
├── pages/            # Страницы приложения
├── storefront/       # Публичная витрина
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── lib/              # Утилиты и helpers
└── assets/           # Статичные ресурсы
```

## Tech Stack

### Core
- **React 19** с Concurrent Features
- **TypeScript** для типобезопасности
- **Vite** для быстрой сборки
- **React Router v7** для навигации

### UI & Styling
- **shadcn/ui** - компоненты на Radix UI
- **Tailwind CSS v4** - утилитарные классы
- **Lucide React** - иконки
- **class-variance-authority** - вариативные стили

### State & Data
- **React Query (TanStack Query)** - серверное состояние
- **React Hook Form** - управление формами
- **Zod** - валидация схем
- **Axios** - HTTP клиент

## Component Patterns

### Базовый компонент
```tsx
interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  )
}
```

### Форма с валидацией
```tsx
const formSchema = z.object({
  name: z.string().min(1, "Обязательное поле"),
  phone: z.string().regex(/^\+7\d{10}$/, "Неверный формат")
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", phone: "" }
})
```

### Data Fetching
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['orders', filters],
  queryFn: () => api.getOrders(filters),
  staleTime: 5 * 60 * 1000 // 5 минут
})
```

## shadcn/ui Components Usage

### Основные компоненты
- **Button** - все кнопки через этот компонент
- **Card** - карточки для группировки контента
- **Dialog** - модальные окна
- **Table** - таблицы данных
- **Form** - формы с React Hook Form
- **Select** - выпадающие списки
- **Calendar** - выбор даты
- **Toast** - уведомления через Sonner

### Вариативность кнопок
```tsx
<Button variant="default">Основная</Button>
<Button variant="outline">С обводкой</Button>
<Button variant="ghost">Прозрачная</Button>
<Button variant="destructive">Удалить</Button>
<Button size="sm">Маленькая</Button>
<Button size="lg">Большая</Button>
```

## Routing Structure

### Приватные маршруты
```tsx
<PrivateRoute>
  <Layout>
    <Routes>
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
    </Routes>
  </Layout>
</PrivateRoute>
```

### Публичные маршруты
- `/login` - авторизация
- `/shop/:shopId` - витрина магазина
- `/status/:token` - отслеживание заказа

## API Integration

### Axios настройка
```tsx
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor для токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### API методы
```tsx
// services/api.ts
export const ordersApi = {
  getAll: (params) => api.get('/api/orders', { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  update: (id, data) => api.put(`/api/orders/${id}`, data)
}
```

## Form Handling

### React Hook Form + Zod
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="customerName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Имя клиента</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

## State Management

### React Query для серверного состояния
```tsx
// Queries
useQuery({ queryKey: ['orders'], queryFn: fetchOrders })

// Mutations
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    queryClient.invalidateQueries(['orders'])
    toast.success('Заказ создан')
  }
})
```

### Local State
- `useState` для UI состояния
- `useReducer` для сложной логики
- Context API для глобального состояния

## WebSocket Integration
```tsx
// hooks/useWebSocket.ts
const { sendMessage, lastMessage, readyState } = useWebSocket(
  'ws://localhost:8001/ws'
)

// Обработка сообщений
useEffect(() => {
  if (lastMessage) {
    const data = JSON.parse(lastMessage.data)
    if (data.type === 'order_update') {
      queryClient.invalidateQueries(['orders', data.orderId])
    }
  }
}, [lastMessage])
```

## Styling Guidelines

### Tailwind классы
```tsx
// Правильно - используем cn() для объединения
className={cn(
  "base-class",
  isActive && "active-class",
  className
)}

// Цветовая схема - фиолетовая
"bg-purple-600 hover:bg-purple-700"
"text-purple-600 border-purple-200"
```

### Responsive Design
```tsx
// Mobile-first подход
"w-full md:w-1/2 lg:w-1/3"
"text-sm md:text-base lg:text-lg"
"flex flex-col md:flex-row"
```

## Mobile Optimization

### Touch-friendly
- Минимальный размер кнопок 44x44px
- Увеличенные области клика
- Свайпы для действий в списках

### Performance
- Lazy loading для страниц
- Виртуализация длинных списков
- Оптимизация изображений

## Common Patterns

### Loading States
```tsx
if (isLoading) return <Skeleton className="h-10 w-full" />
if (error) return <Alert variant="destructive">{error.message}</Alert>
```

### Empty States
```tsx
{data.length === 0 && (
  <Card className="text-center p-8">
    <p>Нет данных для отображения</p>
    <Button className="mt-4">Создать первый</Button>
  </Card>
)}
```

### Error Boundaries
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

## Build & Deploy

### Development
```bash
npm run dev           # Запуск dev сервера
npm run dev:all      # Frontend + Backend
```

### Production Build
```bash
npm run build        # Сборка для production
npm run preview      # Просмотр production сборки
```

### Environment Variables
```env
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001/ws
VITE_TELEGRAM_BOT_USERNAME=cvety_kz_bot
```

## Testing

### E2E Tests (Playwright)
```bash
npm run test:e2e           # Запуск всех тестов
npm run test:e2e:ui        # UI режим
npm run test:e2e:debug     # Debug режим
```

### Тестовые селекторы
```tsx
<button data-testid="submit-order">Оформить</button>
```

## Performance Tips

### Code Splitting
```tsx
const OrdersPage = lazy(() => import('./pages/orders'))
```

### Memo & Callbacks
```tsx
const MemoizedComponent = memo(Component)
const handleClick = useCallback(() => {}, [deps])
const computedValue = useMemo(() => expensive(), [deps])
```

### Image Optimization
```tsx
<img 
  src={thumbnail} 
  loading="lazy"
  decoding="async"
/>
```

## Debugging

### React DevTools
- Проверка props и state
- Profiler для производительности
- Components tree

### Network Tab
- Проверка API запросов
- WebSocket сообщения
- Response timing

## Common Issues & Solutions

### CORS ошибки
- Проверить VITE_API_URL
- Backend CORS настройки

### Токен истёк
- Автоматический refresh в interceptor
- Редирект на /login при 401

### WebSocket отключается
- Автоматический reconnect в useWebSocket
- Exponential backoff

## Import Components Guide
@./components/ui/CLAUDE.md
@./pages/CLAUDE.md
@./storefront/CLAUDE.md