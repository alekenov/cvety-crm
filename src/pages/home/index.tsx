import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, Truck, AlertTriangle } from "lucide-react"

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Добро пожаловать в Cvety.kz</h1>
        <p className="text-muted-foreground mt-2">
          Система управления цветочным магазином
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Новые заказы
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 за последний час
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              В сборке
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Ожидают отправки
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              В доставке
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              На маршруте курьеров
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Проблемы
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Требуют внимания
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Часто используемые операции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Создать новый заказ</p>
            <p className="text-sm">• Принять поставку</p>
            <p className="text-sm">• Проверить остатки</p>
            <p className="text-sm">• Отчет по продажам</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Остатки на складе</CardTitle>
            <CardDescription>
              Критические позиции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Розы красные 60см</span>
              <span className="text-destructive">12 шт</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Тюльпаны белые</span>
              <span className="text-orange-500">25 шт</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Хризантемы розовые</span>
              <span className="text-orange-500">30 шт</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}