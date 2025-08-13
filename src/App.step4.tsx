import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { LoginPage } from "@/pages/login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const queryClient = new QueryClient()

// Тестируем множественные UI компоненты после исправления
function DashboardPlaceholder() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>🚀 Multiple UI Fixed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Множественные UI компоненты исправлены для React 19!</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="default">Основная</Button>
            <Button variant="outline">С обводкой</Button>
            <Button variant="ghost">Прозрачная</Button>
            <Button variant="destructive">Удалить</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Step 4: Testing Multiple UI Components Fixed - Input, Label, Avatar, etc.
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
            <Route path="/shop/:shopId" element={<div className="p-8 text-center">Витрина магазина (Step 4)</div>} />
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