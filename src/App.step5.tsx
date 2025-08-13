import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Layout } from "@/components/layout/layout"
import { LoginPage } from "@/pages/login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useForm } from "react-hook-form"

const queryClient = new QueryClient()

// Демонстрация множественных исправленных компонентов
function ExtensiveUIDemo() {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      priority: "",
      notifications: false,
      theme: "light"
    }
  })

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎉 Step 5: Extensive UI Components Fixed!
            <Badge variant="outline">React 19</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <Alert>
            <AlertDescription>
              15+ UI компонентов исправлены для React 19 production совместимости!
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Левая колонка - Buttons & Actions */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Buttons & Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="default">Основная</Button>
                  <Button variant="outline">С обводкой</Button>
                  <Button variant="ghost">Прозрачная</Button>
                  <Button variant="destructive" size="sm">Удалить</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Dropdown & Select</h3>
                <div className="space-y-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Открыть меню</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Профиль</DropdownMenuItem>
                      <DropdownMenuItem>Настройки</DropdownMenuItem>
                      <DropdownMenuItem>Выход</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flowers">Цветы</SelectItem>
                      <SelectItem value="bouquets">Букеты</SelectItem>
                      <SelectItem value="gifts">Подарки</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Progress & Status</h3>
                <div className="space-y-3">
                  <Progress value={75} className="w-full" />
                  <div className="flex gap-2">
                    <Badge>В работе</Badge>
                    <Badge variant="secondary">Средний приоритет</Badge>
                    <Badge variant="outline">React 19</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка - Form Components */}
            <div className="space-y-6">
              <Form {...form}>
                <form className="space-y-4">
                  <h3 className="font-semibold">Form Components</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите название..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Добавьте описание..." 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Label>Приоритет</Label>
                    <RadioGroup defaultValue="medium">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low">Низкий</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">Средний</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high">Высокий</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="notifications" />
                      <Label htmlFor="notifications">Получать уведомления</Label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme-switch">Темная тема</Label>
                      <Switch id="theme-switch" />
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            <p>✅ Исправлены: button, card, input, label, avatar, scroll-area, tabs, command, tooltip, popover, dialog, dropdown-menu, select, form, alert, textarea, checkbox, switch, badge, radio-group, progress, separator</p>
            <p className="mt-2"><strong>Step 5:</strong> Testing 20+ Fixed UI Components for React 19 Production</p>
          </div>
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
            <Route path="/shop/:shopId" element={<div className="p-8 text-center">Витрина магазина (Step 5)</div>} />
            <Route path="*" element={
              <Layout>
                <ExtensiveUIDemo />
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App