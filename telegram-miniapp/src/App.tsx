import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { TelegramProvider } from './providers/TelegramProvider'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { Navigation } from './components/Navigation'
import TelegramAuth from './components/TelegramAuth'
import ProtectedRoute from './components/ProtectedRoute'
import UserHeader from './components/UserHeader'

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

  const handleAuthSuccess = (token: string, authData?: any) => {
    if (authData) {
      login(token, authData.role, authData.userName, authData.shopId, authData.shopName)
    } else {
      login(token)
    }
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // Show error screen
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Ошибка авторизации</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Пожалуйста, закройте это окно и попробуйте снова через бота @HHFlorBot
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <TelegramAuth 
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    )
  }

  // Для флористов показываем только заказы и товары
  // const isFlorist = userRole === 'florist'
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />
        {/* Уведомления доступны только админам и менеджерам */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/orders">
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Navigation />
    </div>
  )
}

export function App() {
  // Updated with new Railway deployment workflow
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TelegramProvider>
    </QueryClientProvider>
  )
}