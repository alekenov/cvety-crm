import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { OrdersPage } from "@/pages/orders"
import { NewOrderPage } from "@/pages/orders/new"
import { OrderDetailPage } from "@/pages/orders/[id]"
import { WarehousePage } from "@/pages/warehouse"
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

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/tracking/:token" element={<TrackingPage />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/orders" replace />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/new" element={<NewOrderPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/warehouse" element={<WarehousePage />} />
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
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App