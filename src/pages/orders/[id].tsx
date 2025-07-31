import { useState, useEffect } from "react"
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
import type { Order, OrderStatus } from "@/lib/types"
import { Timeline, type TimelineEvent } from "@/components/orders/timeline"
import { ordersApi } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

// Helper function to map event type to status label
const eventTypeToStatus = {
  created: 'Создан',
  status_changed: 'Статус изменен',
  payment_received: 'Оплачен',
  florist_assigned: 'Назначен флорист',
  comment_added: 'Комментарий',
  issue_reported: 'Проблема'
}

interface OrderDetailResponse {
  id: number
  created_at: string
  updated_at: string
  status: string
  customer_phone: string
  recipient_phone: string | null
  recipient_name: string | null
  address: string | null
  delivery_method: string
  delivery_window: {
    from: string
    to: string
  } | null
  flower_sum: number
  delivery_fee: number
  total: number
  payment_method?: string
  tracking_token: string
  items?: Array<{
    id: number
    product_name: string
    price: number
    quantity: number
    total: number
  }>
  assigned_florist?: {
    id: number
    name: string
    phone: string
  }
  courier?: {
    id: number
    name: string
    phone: string
  }
  customer?: {
    id: number
    name: string
    phone: string
    orders_count: number
    total_spent: number
  }
  history?: Array<{
    id: number
    event_type: string
    comment: string
    created_at: string
    user?: string
  }>
}

const statusConfig = {
  new: { label: "Новый", color: "secondary" },
  paid: { label: "Оплачен", color: "default" },
  assembled: { label: "Собран", color: "warning" },
  delivery: { label: "Доставка", color: "default" },
  self_pickup: { label: "Самовывоз", color: "default" },
  issue: { label: "Проблема", color: "destructive" }
} as const

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comment, setComment] = useState("")
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("new")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  
  // Fetch order data
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      return await ordersApi.getById(id!)
    },
    enabled: !!id
  })
  
  // Update local state when order data is loaded
  useEffect(() => {
    if (order) {
      setOrderStatus(order.status as OrderStatus)
      // Transform history to timeline format
      const transformedHistory = order.history?.map((h: any) => ({
        id: String(h.id),
        status: eventTypeToStatus[h.event_type as keyof typeof eventTypeToStatus] || h.event_type,
        timestamp: new Date(h.created_at),
        user: h.user || 'Система',
        comment: h.comment || '',
        type: h.event_type === 'payment_received' ? 'success' : 'default'
      })) || []
      setTimeline(transformedHistory)
    }
  }, [order])

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

  const currentStatus = statusConfig[orderStatus as keyof typeof statusConfig]

  // Get next status based on current status
  const getNextStatus = (status: OrderStatus): { status: OrderStatus, label: string } | null => {
    switch (status) {
      case 'new': return { status: 'paid', label: 'Оплачен' }
      case 'paid': return { status: 'assembled', label: 'Собран' }
      case 'assembled': return order?.delivery_method === 'delivery' 
        ? { status: 'delivery', label: 'В доставку' }
        : { status: 'self_pickup', label: 'Готов к выдаче' }
      case 'delivery': return null // Final state for delivery
      case 'self_pickup': return null // Final state for pickup
      default: return null
    }
  }

  const nextStatus = getNextStatus(orderStatus)

  const handleStatusProgression = async () => {
    if (nextStatus && !isUpdatingStatus && id) {
      setIsUpdatingStatus(true)
      
      try {
        await ordersApi.updateStatus(Number(id), nextStatus.status)
        setOrderStatus(nextStatus.status)
        
        // Add new timeline event
        const newEvent = {
          id: String(Date.now()),
          status: nextStatus.label,
          timestamp: new Date(),
          user: "Менеджер",
          comment: `Статус изменен на "${nextStatus.label}"`,
          type: "success" as const
        }
        setTimeline([...timeline, newEvent])
        
        toast.success(`Статус изменен на "${nextStatus.label}"`)
      } catch (error) {
        toast.error('Ошибка при изменении статуса')
      } finally {
        setIsUpdatingStatus(false)
      }
    }
  }

  const handleStatusRollback = () => {
    toast.info("Откат статуса")
    // Here you would show a dialog with previous statuses
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>
  }
  
  if (error || !order) {
    return <div className="flex items-center justify-center h-64">Ошибка загрузки заказа</div>
  }
  
  return (
    <div className="space-y-4">
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
              Заказ #{order.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              Создан {new Date(order.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentStatus.color as any} className="text-sm">
            {currentStatus.label}
          </Badge>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.location.href = `tel:${order.customer?.phone || order.customer_phone}`}
            title="Позвонить клиенту"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.open(`https://wa.me/${(order.customer?.phone || order.customer_phone).replace(/\D/g, '')}`, '_blank')}
            title="Написать в WhatsApp"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => toast.info("Отслеживание доставки")}
            title="Отследить доставку"
          >
            <Truck className="h-4 w-4" />
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
              <DropdownMenuItem>Редактировать заказ</DropdownMenuItem>
              <DropdownMenuItem onClick={handleStatusRollback}>
                Откатить статус
              </DropdownMenuItem>
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
        <div className="space-y-4 lg:col-span-2">
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
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    {(order.customer?.name || order.recipient_name || 'К').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{order.customer?.name || order.recipient_name || 'Клиент'}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.customer?.phone || order.customer_phone}
                  </div>
                  {order.customer && (
                    <div className="mt-2 flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Заказов: </span>
                        <span className="font-medium">{order.customer.orders_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Сумма: </span>
                        <span className="font-medium">
                          {(order.customer.total_spent || 0).toLocaleString()} ₸
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/customers/${order.customer?.id}`)
                  }}
                >
                  Профиль
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assigned florist */}
          {order.assigned_florist && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Ответственный флорист
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{order.assigned_florist.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.assigned_florist.phone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="font-medium">{item.product_name}</div>
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
                  <span>{order.flower_sum.toLocaleString()} ₸</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span>{order.delivery_fee.toLocaleString()} ₸</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Итого</span>
                  <span className="text-xl">{order.total.toLocaleString()} ₸</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {order.delivery_method === 'delivery' ? 'Доставка' : 'Самовывоз'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Дата и время</div>
                    <div className="font-medium">
                      {order.delivery_window ? (
                        <>
                          {new Date(order.delivery_window.from).toLocaleDateString('ru-RU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}, {new Date(order.delivery_window.from).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(order.delivery_window.to).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        'Не указано'
                      )}
                    </div>
                  </div>
                </div>
                {order.delivery_method === 'delivery' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Адрес доставки</div>
                        <div className="font-medium">{order.address || 'Не указан'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Получатель</div>
                        <div className="font-medium">
                          {order.recipient_name || order.customer?.name || 'Не указан'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.recipient_phone || order.customer_phone}
                        </div>
                      </div>
                    </div>
                    {order.courier && (
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Курьер</div>
                          <div className="font-medium">
                            {order.courier.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.courier.phone}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {order.delivery_method === 'self_pickup' && (
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Адрес магазина</div>
                      <div className="font-medium">ул. Абая 150</div>
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
                    {order.payment_method === 'kaspi' && 'Kaspi Pay'}
                    {order.payment_method === 'cash' && 'Наличными'}
                    {order.payment_method === 'transfer' && 'Перевод'}
                    {order.payment_method === 'qr' && 'QR код'}
                    {!order.payment_method && 'Не указан'}
                  </span>
                </div>
                {order.status !== 'new' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Дата оплаты</span>
                    <span className="text-sm">
                      {order.history?.find((h: any) => h.event_type === 'payment_received')?.created_at
                        ? new Date(order.history.find((h: any) => h.event_type === 'payment_received').created_at).toLocaleString('ru-RU')
                        : 'Оплачен'
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status progression button - Desktop only */}
          {nextStatus && (
            <div className="hidden md:block">
              <Button 
                size="lg" 
                onClick={handleStatusProgression}
                disabled={isUpdatingStatus}
                className="w-full"
              >
                {isUpdatingStatus ? 'Обновление...' : nextStatus.label}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>История заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline as TimelineEvent[]} />
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

      {/* Status progression button - Mobile only */}
      {nextStatus && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-40 md:hidden">
          <Button 
            size="lg" 
            onClick={handleStatusProgression}
            disabled={isUpdatingStatus}
            className="w-full max-w-lg shadow-lg mb-16"
          >
            {isUpdatingStatus ? 'Обновление...' : nextStatus.label}
          </Button>
        </div>
      )}
    </div>
  )
}