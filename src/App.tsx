import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { LoginPage } from "@/pages/login"
import { OrdersPage } from "@/pages/orders"
import { NewOrderPage } from "@/pages/orders/new"
import { OrderDetailPage } from "@/pages/orders/[id]"
import { WarehousePage } from "@/pages/warehouse"
import { WarehouseItemDetailPage } from "@/pages/warehouse/[id]"
import { DeliveryPage } from "@/pages/warehouse/delivery"
import { TrackingPage } from "@/pages/tracking"
import { CustomersPage } from "@/pages/customers"
import { CustomerDetailPage } from "@/pages/customers/[id]"
import { ProductionPage } from "@/pages/production"
import { BouquetCalculatorPage } from "@/pages/production/calculator"
import { CatalogPage } from "@/pages/catalog"
import { NewProductPage } from "@/pages/catalog/new"
import { SettingsPage } from "@/pages/settings"
import { UsersPage } from "@/pages/settings/users"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      try {
        await authApi.getMe()
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('authToken')
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  // Small change to test Docker cache optimization
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tracking/:token" element={<TrackingPage />} />
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/orders" replace />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/new" element={<NewOrderPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/warehouse" element={<WarehousePage />} />
                    <Route path="/warehouse/:id" element={<WarehouseItemDetailPage />} />
                    <Route path="/warehouse/delivery" element={<DeliveryPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailPage />} />
                    <Route path="/production" element={<ProductionPage />} />
                    <Route path="/production/calculator" element={<BouquetCalculatorPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/catalog/new" element={<NewProductPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/users" element={<UsersPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App