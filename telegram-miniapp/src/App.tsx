import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { TelegramProvider } from './providers/TelegramProvider'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { Navigation } from './components/Navigation'
import TelegramAuth from './components/TelegramAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 2,
    },
  },
})

function AppContent() {
  const { isAuthenticated, login } = useAuth()

  const handleAuthSuccess = (token: string) => {
    login(token)
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // Можно добавить показ уведомления об ошибке
  }

  if (!isAuthenticated) {
    return (
      <TelegramAuth 
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    )
  }

  return (
    <TelegramProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
        <Navigation />
      </div>
    </TelegramProvider>
  )
}

export function App() {
  // Updated with new Railway deployment workflow
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}