import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { PrivateRoute } from "@/components/auth/private-route"
import { LoginPage } from "@/pages/login"
import { OrdersPage } from "@/pages/orders"
import { NewOrderPage } from "@/pages/orders/new"
import { OrderDetailPage } from "@/pages/orders/[id]"
import { WarehousePage } from "@/pages/warehouse"
import { WarehouseItemDetailPage } from "@/pages/warehouse/[id]"
// import { DeliveryPage } from "@/pages/warehouse/delivery"
import { CustomersPage } from "@/pages/customers"
import { CustomerDetailPage } from "@/pages/customers/[id]"
import { ProductionPage } from "@/pages/production"
import { BouquetCalculatorPage } from "@/pages/production/calculator"
import { CatalogPage } from "@/pages/catalog"
import { NewProductPage } from "@/pages/catalog/new"
import { ProductDetailPage } from "@/pages/catalog/[id]"
import { EditProductPage } from "@/pages/catalog/[id]/edit"
import { SettingsPage } from "@/pages/settings"
import { UsersPage } from "@/pages/settings/users"
import { CalculatorMaterialsPage } from "@/pages/settings/calculator-materials"
import SuppliesPage from "@/pages/supplies/SuppliesPage"
import { SupplyDetail } from "@/pages/supplies"
import { StorefrontPage } from "@/storefront/pages/StorefrontPage"
import { CheckoutPage } from "@/storefront/pages/CheckoutPage"
import { CartPage } from "@/storefront/pages/CartPage"
import { OrderSuccessPage } from "@/storefront/pages/OrderSuccessPage"
import { TrackingPage as StorefrontTrackingPage } from "@/storefront/pages/TrackingPage"
import { StorefrontLayout } from "@/storefront/components/StorefrontLayout"

const queryClient = new QueryClient()

function App() {
  // Small change to test Docker cache optimization
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/status/:token" element={<StorefrontTrackingPage />} />
            <Route path="/shop/:shopId" element={<StorefrontLayout />}>
              <Route index element={<StorefrontPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:token" element={<OrderSuccessPage />} />
            </Route>
            <Route path="*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/orders" replace />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/new" element={<NewOrderPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/warehouse" element={<WarehousePage />} />
                    <Route path="/warehouse/:id" element={<WarehouseItemDetailPage />} />
                    {/* <Route path="/warehouse/delivery" element={<DeliveryPage />} /> */}
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailPage />} />
                    <Route path="/production" element={<ProductionPage />} />
                    <Route path="/production/calculator" element={<BouquetCalculatorPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/catalog/new" element={<NewProductPage />} />
                    <Route path="/catalog/:id" element={<ProductDetailPage />} />
                    <Route path="/catalog/:id/edit" element={<EditProductPage />} />
                    <Route path="/supplies" element={<SuppliesPage />} />
                    <Route path="/supplies/import" element={<Navigate to="/supplies" replace />} />
                    <Route path="/supplies/:id" element={<SupplyDetail />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/users" element={<UsersPage />} />
                    <Route path="/settings/calculator" element={<CalculatorMaterialsPage />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App