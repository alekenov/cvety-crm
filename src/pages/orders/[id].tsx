import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Truck, 
  CreditCard,
  Package,
  User,
  MessageSquare,
  Printer,
  Share2,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Timeline, type TimelineEvent } from "@/components/orders/timeline"

// Mock data for order details
const mockOrder = {
  id: "1",
  status: "paid",
  createdAt: new Date("2024-01-26T10:00:00"),
  customer: {
    id: "1",
    name: "Айгерим Сатпаева",
    phone: "+7 (707) 123-45-67",
    email: "aigerim@example.com",
    avatar: null,
    ordersCount: 5,
    totalSpent: 82500
  },
  items: [
    {
      id: "1",
      name: "Букет из 25 красных роз",
      quantity: 1,
      price: 15000,
      total: 15000,
      category: "bouquet"
    }
  ],
  delivery: {
    method: "delivery",
    date: new Date("2024-01-26"),
    timeFrom: "14:00",
    timeTo: "16:00",
    address: "ул. Абая 150, кв 25",
    recipientName: "Айгерим",
    recipientPhone: "+7 (707) 123-45-67",
    courierName: "Бауыржан",
    courierPhone: "+7 (777) 888-99-00"
  },
  payment: {
    method: "kaspi",
    status: "paid",
    paidAt: new Date("2024-01-26T10:05:00")
  },
  totals: {
    subtotal: 15000,
    deliveryFee: 1500,
    discount: 0,
    total: 16500
  },
  timeline: [
    {
      id: "1",
      status: "Создан",
      timestamp: new Date("2024-01-26T10:00:00"),
      user: "Менеджер Алия",
      comment: "Заказ создан",
      type: "default" as const
    },
    {
      id: "2",
      status: "Оплачен",
      timestamp: new Date("2024-01-26T10:05:00"),
      user: "Система",
      comment: "Оплата получена через Kaspi Pay",
      type: "success" as const
    },
    {
      id: "3",
      status: "Сборка",
      timestamp: new Date("2024-01-26T11:00:00"),
      user: "Флорист Гульнара",
      comment: "Начата сборка букета",
      type: "default" as const
    }
  ]
}

const statusConfig = {
  created: { label: "Создан", color: "secondary" },
  paid: { label: "Оплачен", color: "default" },
  processing: { label: "Сборка", color: "warning" },
  ready: { label: "Готов", color: "success" },
  delivery: { label: "Доставка", color: "default" },
  delivered: { label: "Доставлен", color: "success" },
  cancelled: { label: "Отменен", color: "destructive" },
  problem: { label: "Проблема", color: "destructive" }
} as const

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState("")

  const handleAddComment = () => {
    if (comment.trim()) {
      toast.success("Комментарий добавлен")
      setComment("")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success("Ссылка скопирована")
  }

  const currentStatus = statusConfig[mockOrder.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Заказ #{mockOrder.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              Создан {mockOrder.createdAt.toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentStatus.color as any} className="text-sm">
            {currentStatus.label}
          </Badge>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Изменить статус</DropdownMenuItem>
              <DropdownMenuItem>Редактировать заказ</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Отменить заказ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Информация о клиенте
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mockOrder.customer.avatar || undefined} />
                  <AvatarFallback>
                    {mockOrder.customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{mockOrder.customer.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {mockOrder.customer.phone}
                  </div>
                  {mockOrder.customer.email && (
                    <div className="text-sm text-muted-foreground">
                      {mockOrder.customer.email}
                    </div>
                  )}
                  <div className="mt-2 flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Заказов: </span>
                      <span className="font-medium">{mockOrder.customer.ordersCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Сумма: </span>
                      <span className="font-medium">
                        {mockOrder.customer.totalSpent.toLocaleString()} ₸
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Профиль
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Товары
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.price.toLocaleString()} ₸ × {item.quantity} = {item.total.toLocaleString()} ₸
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары</span>
                  <span>{mockOrder.totals.subtotal.toLocaleString()} ₸</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span>{mockOrder.totals.deliveryFee.toLocaleString()} ₸</span>
                </div>
                {mockOrder.totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Скидка</span>
                    <span className="text-destructive">
                      -{mockOrder.totals.discount.toLocaleString()} ₸
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Итого</span>
                  <span className="text-xl">{mockOrder.totals.total.toLocaleString()} ₸</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Доставка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Дата и время</div>
                    <div className="font-medium">
                      {mockOrder.delivery.date.toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {mockOrder.delivery.timeFrom} - {mockOrder.delivery.timeTo}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Адрес доставки</div>
                    <div className="font-medium">{mockOrder.delivery.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Получатель</div>
                    <div className="font-medium">
                      {mockOrder.delivery.recipientName}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {mockOrder.delivery.recipientPhone}
                    </div>
                  </div>
                </div>
                {mockOrder.delivery.courierName && (
                  <div className="flex items-start gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Курьер</div>
                      <div className="font-medium">
                        {mockOrder.delivery.courierName}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {mockOrder.delivery.courierPhone}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Оплата
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Способ оплаты</span>
                  <span className="font-medium">
                    {mockOrder.payment.method === 'kaspi' && 'Kaspi Pay'}
                    {mockOrder.payment.method === 'cash' && 'Наличными'}
                    {mockOrder.payment.method === 'transfer' && 'Перевод'}
                    {mockOrder.payment.method === 'qr' && 'QR код'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Статус</span>
                  <Badge variant="success">
                    {mockOrder.payment.status === 'paid' ? 'Оплачено' : 'Ожидает оплаты'}
                  </Badge>
                </div>
                {mockOrder.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Оплачено</span>
                    <span className="text-sm">
                      {mockOrder.payment.paidAt.toLocaleString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Позвонить клиенту
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Отправить SMS
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Truck className="mr-2 h-4 w-4" />
                Отследить доставку
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>История заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={mockOrder.timeline as TimelineEvent[]} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Комментарии</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Добавить комментарий..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!comment.trim()}
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Добавить комментарий
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}