import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const queryClient = new QueryClient()

function TestPage() {
  return (
    <div className="p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Simple App Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Testing ThemeProvider + Basic Components</p>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cvety-theme">
        <TestPage />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App