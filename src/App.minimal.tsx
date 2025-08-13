import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { LoginPage } from "@/pages/login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const queryClient = new QueryClient()

function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>🌸 Cvety.kz CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Полная версия CRM системы для управления цветочным магазином</p>
          <Button onClick={() => window.location.href = '/login'}>
            Войти в систему
          </Button>
          <p className="text-sm text-muted-foreground">
            React 19 + TypeScript + shadcn/ui - Full Version Test
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
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App