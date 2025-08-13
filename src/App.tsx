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
import { POSWarehousePage } from "@/pages/pos-warehouse"
import { POSWarehouseExactPage } from "@/pages/pos-warehouse-exact"
import { POSWarehouseFigmaPage } from "@/pages/pos-warehouse-figma"
import POSApp from "@/pos-warehouse/POSApp"
import { StorefrontPage } from "@/storefront/pages/StorefrontPage"
import { CheckoutPage } from "@/storefront/pages/CheckoutPage"
import { CartPage } from "@/storefront/pages/CartPage"
import { OrderSuccessPage } from "@/storefront/pages/OrderSuccessPage"
import { TrackingPage as StorefrontTrackingPage } from "@/storefront/pages/TrackingPage"
import { StorefrontLayout } from "@/storefront/components/StorefrontLayout"
import StorefrontV2App from "@/storefront-v2/StorefrontV2App"
import LandingPage from "@/pages/landing/LandingPage"
import FloristCRM from "@/prototype/FloristCRM"
import FloristCRMWithAPI from "@/prototype/FloristCRMWithAPI"
import MobileFloristCRM from "@/prototype/MobileFloristCRM"
import FloristCRMResponsive from "@/prototype/FloristCRMResponsive"
import MobileFloristCRMv2 from "@/prototype/MobileFloristCRMv2"

const queryClient = new QueryClient()

function App() {
  // Small change to test Docker cache optimization
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/prototype/order-create" element={<FloristCRM />} />
            <Route path="/prototype/order-create-api" element={<FloristCRMWithAPI />} />
            <Route path="/prototype/order-create-mobile" element={<MobileFloristCRM />} />
            <Route path="/prototype/order-create-responsive" element={<FloristCRMResponsive />} />
            <Route path="/prototype/order-create-v2" element={<MobileFloristCRMv2 />} />
            <Route path="/status/:token" element={<StorefrontTrackingPage />} />
            
            {/* POS Warehouse routes - moved here to avoid conflict with shop/:shopId */}
            <Route path="/pos-warehouse" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseFigmaPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-warehouse/inventory" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseFigmaPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-warehouse/in" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseFigmaPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-warehouse/:productId" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseFigmaPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-warehouse-exact" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseExactPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-warehouse-figma" element={
              <PrivateRoute>
                <Layout>
                  <POSWarehouseFigmaPage />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/pos-demo" element={
              <PrivateRoute>
                <Layout>
                  <POSApp />
                </Layout>
              </PrivateRoute>
            } />
            
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
            {/* Storefront V2 - теперь основной маршрут */}
            <Route path="/shop/:shopId/*" element={<StorefrontV2App />} />
            
            {/* Storefront V1 - старая версия для обратной совместимости */}
            <Route path="/shop/:shopId/v1" element={<StorefrontLayout />}>
              <Route index element={<StorefrontPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:token" element={<OrderSuccessPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App