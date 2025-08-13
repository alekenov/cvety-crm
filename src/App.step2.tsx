import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { LoginPage } from "@/pages/login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const queryClient = new QueryClient()

// Простая заглушка для тестирования Layout
function DashboardPlaceholder() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>🌸 CRM Dashboard with Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Тестируем Layout компонент</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => window.location.href = '/orders'}>
              Заказы
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/shop/1'}>
              Витрина
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/customers'}>
              Клиенты
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/catalog'}>
              Каталог
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Step 2: Testing Layout component
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shop/:shopId" element={<div className="p-8 text-center">Витрина магазина (Step 2)</div>} />
            <Route path="*" element={
              <Layout>
                <DashboardPlaceholder />
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App