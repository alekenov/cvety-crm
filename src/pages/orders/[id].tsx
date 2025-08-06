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
  MoreHorizontal,
  Edit,
  Edit2,
  AlertCircle,
  ExternalLink,
  Copy
} from "lucide-react"
import { formatRelativeDate, formatShortDate } from "@/lib/date-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Order, OrderStatus } from "@/lib/types"
import { Timeline, type TimelineEvent } from "@/components/orders/timeline"
import { DeliveryDateEditor } from "@/components/orders/delivery-date-editor"
import { AddressEditor } from "@/components/orders/address-editor"
import { ordersApi } from "@/lib/api"
import { commentsApi } from "@/lib/api/comments"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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
  comments?: Array<{
    id: number
    text: string
    created_at: string
    user: {
      id: number
      name: string
    }
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

const statusLabels: Record<string, string> = {
  new: "Новый",
  paid: "Оплачен",
  assembled: "Собран",
  delivery: "Доставка",
  self_pickup: "Самовывоз",
  issue: "Проблема"
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState("")
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("new")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false)
  const [selectedRollbackStatus, setSelectedRollbackStatus] = useState<string>("")
  const [rollbackReason, setRollbackReason] = useState("")
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isEditingDeliveryDate, setIsEditingDeliveryDate] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  
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

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!id) throw new Error('No order ID')
      return await commentsApi.create(Number(id), { text })
    },
    onSuccess: () => {
      toast.success("Комментарий добавлен")
      setComment("")
      // Invalidate order query to refresh comments
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
    onError: () => {
      toast.error("Ошибка при добавлении комментария")
    }
  })

  const handleAddComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate(comment)
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

  const handleCopyTrackingLink = () => {
    if (order?.tracking_token) {
      const trackingUrl = `${window.location.origin}/status/${order.tracking_token}`
      navigator.clipboard.writeText(trackingUrl)
      toast.success("Ссылка для отслеживания скопирована")
    }
  }

  const handleOpenTracking = () => {
    if (order?.tracking_token) {
      const trackingUrl = `${window.location.origin}/status/${order.tracking_token}`
      window.open(trackingUrl, '_blank')
    }
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
    setIsRollbackDialogOpen(true)
    setSelectedRollbackStatus("")
    setRollbackReason("")
  }

  const rollbackStatusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason: string }) => {
      if (!id) throw new Error('No order ID')
      return await ordersApi.rollbackStatus(Number(id), status, reason)
    },
    onSuccess: () => {
      toast.success("Статус успешно откачен")
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setIsRollbackDialogOpen(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Ошибка при откате статуса"
      toast.error(message)
    }
  })

  const getPreviousStatuses = () => {
    if (!order) return []
    const currentStatus = order.status
    const validRollbacks: Record<string, string[]> = {
      'paid': ['new'],
      'assembled': ['paid', 'new'],
      'delivery': ['assembled', 'paid'],
      'self_pickup': ['assembled', 'paid'],
      'issue': ['new', 'paid', 'assembled', 'delivery', 'self_pickup']
    }
    return validRollbacks[currentStatus] || []
  }

  const handleCancelOrder = () => {
    setIsCancelDialogOpen(true)
    setCancelReason("")
  }

  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!id) throw new Error('No order ID')
      return await ordersApi.cancelOrder(Number(id), reason)
    },
    onSuccess: () => {
      toast.success("Заказ отменен")
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setIsCancelDialogOpen(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Ошибка при отмене заказа"
      toast.error(message)
    }
  })

  const updateDeliveryWindowMutation = useMutation({
    mutationFn: async (deliveryWindow: { from: string; to: string }) => {
      if (!id) throw new Error('No order ID')
      return await ordersApi.updateDeliveryWindow(Number(id), deliveryWindow)
    },
    onSuccess: () => {
      toast.success("Время доставки обновлено")
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setIsEditingDeliveryDate(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Ошибка при обновлении времени доставки"
      toast.error(message)
    }
  })

  const updateAddressMutation = useMutation({
    mutationFn: async (address: string) => {
      if (!id) throw new Error('No order ID')
      return await ordersApi.update(Number(id), { address })
    },
    onSuccess: () => {
      toast.success("Адрес доставки обновлен")
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setIsEditingAddress(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Ошибка при обновлении адреса"
      toast.error(message)
    }
  })

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
              Создан {formatRelativeDate(order.created_at)}
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
            onClick={() => window.open(`https://wa.me/${(order.customer?.phone || order.customer_phone).replace(/\D/g, '')}`, '_blank')}
            title="Написать в WhatsApp"
            className="md:inline-flex"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `tel:${order.customer?.phone || order.customer_phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Позвонить клиенту
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenTracking}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Открыть трекинг
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyTrackingLink}>
                <Copy className="mr-2 h-4 w-4" />
                Скопировать ссылку трекинга
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Печать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать заказ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleStatusRollback}>
                Откатить статус
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleCancelOrder}
              >
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
              <div className="flex items-start justify-between">
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
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-muted" />
                      <div className="flex-1">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.price.toLocaleString()} ₸ × {item.quantity} = {item.total.toLocaleString()} ₸
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Товары не указаны
                  </div>
                )}
              </div>
              {order.items && order.items.length > 0 && <Separator className="my-4" />}
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
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Дата и время</div>
                    {isEditingDeliveryDate ? (
                      <DeliveryDateEditor
                        deliveryWindow={order.delivery_window}
                        onSave={(deliveryWindow) => {
                          updateDeliveryWindowMutation.mutate(deliveryWindow)
                        }}
                        onCancel={() => setIsEditingDeliveryDate(false)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setIsEditingDeliveryDate(true)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {order.delivery_method === 'delivery' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Адрес доставки</div>
                        {isEditingAddress ? (
                          <AddressEditor
                            address={order.address}
                            onSave={(address) => {
                              updateAddressMutation.mutate(address)
                            }}
                            onCancel={() => setIsEditingAddress(false)}
                          />
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">
                                {order.address ? (
                                  order.address
                                ) : (
                                  <span className="text-amber-600">Требует уточнения</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsEditingAddress(true)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {order.address && (order as any).addressNeedsClarification && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Адрес требует уточнения</span>
                              </div>
                            )}
                            {order.address && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => {
                                  const newValue = !(order as any).addressNeedsClarification
                                  ordersApi.update(Number(id), { 
                                    address_needs_clarification: newValue 
                                  }).then(() => {
                                    toast.success(newValue ? "Адрес помечен для уточнения" : "Адрес больше не требует уточнения")
                                    queryClient.invalidateQueries({ queryKey: ['order', id] })
                                  })
                                }}
                              >
                                {(order as any).addressNeedsClarification ? "Адрес уточнен" : "Требует уточнения"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Получатель</div>
                        <div className="font-medium">
                          {order.recipient_name || order.customer?.name || 'Не указан'}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {order.recipient_phone || order.customer_phone}
                          </div>
                          {(order.recipient_phone || order.customer_phone) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://wa.me/${(order.recipient_phone || order.customer_phone).replace(/\D/g, '')}`, '_blank')}
                              title="Написать в WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
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
                        ? formatRelativeDate(order.history.find((h: any) => h.event_type === 'payment_received').created_at)
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
              <div className="space-y-4">
                {/* Existing comments */}
                {order?.comments && order.comments.length > 0 && (
                  <div className="space-y-3">
                    {order.comments.map((c) => (
                      <div key={c.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatShortDate(c.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Добавить комментарий..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    className="w-full"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {addCommentMutation.isPending ? 'Добавление...' : 'Добавить комментарий'}
                  </Button>
                </div>
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
            className="w-full max-w-lg shadow-lg mb-20"
          >
            {isUpdatingStatus ? 'Обновление...' : nextStatus.label}
          </Button>
        </div>
      )}

      {/* Status Rollback Dialog */}
      <Dialog open={isRollbackDialogOpen} onOpenChange={setIsRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Откатить статус заказа</DialogTitle>
            <DialogDescription>
              Выберите предыдущий статус, к которому нужно откатить заказ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={selectedRollbackStatus} onValueChange={setSelectedRollbackStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {getPreviousStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status as OrderStatus] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Причина отката</Label>
              <Textarea
                id="reason"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Укажите причину отката статуса"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRollbackDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (selectedRollbackStatus && rollbackReason) {
                  rollbackStatusMutation.mutate({
                    status: selectedRollbackStatus,
                    reason: rollbackReason
                  })
                }
              }}
              disabled={!selectedRollbackStatus || !rollbackReason || rollbackStatusMutation.isPending}
            >
              {rollbackStatusMutation.isPending ? 'Откат...' : 'Откатить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Cancellation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить заказ</DialogTitle>
            <DialogDescription>
              Укажите причину отмены заказа. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Причина отмены</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Укажите причину отмены заказа"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancelReason.trim()) {
                  cancelOrderMutation.mutate(cancelReason)
                }
              }}
              disabled={!cancelReason.trim() || cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? 'Отмена...' : 'Отменить заказ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}