import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Clock, Package, ChevronRight } from "lucide-react"
import type { Order } from "@/lib/types"
import { formatDistanceToNow, format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: string, status: Order['status']) => void
}

const statusConfig = {
  new: { label: 'Новый', color: 'bg-blue-500' },
  paid: { label: 'Оплачен', color: 'bg-green-500' },
  assembled: { label: 'Собран', color: 'bg-purple-500' },
  delivery: { label: 'Доставка', color: 'bg-orange-500' },
  self_pickup: { label: 'Самовывоз', color: 'bg-yellow-500' },
  issue: { label: 'Проблема', color: 'bg-red-500' },
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const navigate = useNavigate()
  const status = statusConfig[order.status]
  
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${order.customerPhone}`
  }

  const handleCardClick = () => {
    navigate(`/orders/${order.id}`)
  }

  const handleStatusChange = (e: React.MouseEvent, newStatus: Order['status']) => {
    e.stopPropagation()
    if (onStatusChange) {
      onStatusChange(order.id, newStatus)
    }
  }

  const getNextStatus = (): Order['status'] | null => {
    switch (order.status) {
      case 'new': return 'paid'
      case 'paid': return 'assembled'
      case 'assembled': return order.deliveryMethod === 'delivery' ? 'delivery' : 'self_pickup'
      default: return null
    }
  }

  const nextStatus = getNextStatus()

  return (
    <Card 
      className="mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">#{order.id}</span>
            <Badge className={cn("text-white", status.color)}>
              {status.label}
            </Badge>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Клиент и телефон */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{order.recipientName || 'Клиент'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handlePhoneClick}
          >
            <Phone className="h-4 w-4 mr-1" />
            {order.customerPhone}
          </Button>
        </div>

        {/* Адрес доставки */}
        {order.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{order.address}</span>
          </div>
        )}

        {/* Время доставки */}
        {order.deliveryWindow && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(order.deliveryWindow.from).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
              })} {format(order.deliveryWindow.from, "HH:mm")} - {format(order.deliveryWindow.to, "HH:mm")}
            </span>
          </div>
        )}

        {/* Товары */}
        <div className="flex items-start gap-2 text-sm">
          <Package className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.slice(0, 2).map((item, index) => (
                  <div key={index}>
                    {item.productName} × {item.quantity}
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className="text-muted-foreground">
                    и еще {order.items.length - 2} товар(ов)
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">Нет товаров</div>
            )}
          </div>
        </div>

        {/* Сумма и действия */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="font-semibold">
            {(order.totalAmount || 0).toLocaleString('ru-RU')} ₸
          </span>
          {nextStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleStatusChange(e, nextStatus)}
            >
              {statusConfig[nextStatus].label}
            </Button>
          )}
        </div>

        {/* Время создания */}
        <div className="text-xs text-muted-foreground text-right">
          {formatDistanceToNow(new Date(order.createdAt), {
            addSuffix: true,
            locale: ru
          })}
        </div>
      </CardContent>
    </Card>
  )
}