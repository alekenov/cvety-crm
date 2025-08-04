import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, User, AlertCircle } from "lucide-react"
import type { Order } from "@/lib/types"
import { format } from "date-fns"
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
  const status = statusConfig[order.status] || { label: order.status, color: 'bg-gray-500' }
  
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
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">#{order.id}</span>
            <Badge className={cn("text-white", status.color)}>
              {status.label}
            </Badge>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        {order.assignedTo && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <User className="h-3 w-3" />
            <span>{order.assignedTo.name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3">
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
            {order.customerPhone}
          </Button>
        </div>

        {/* Адрес и время доставки */}
        {(order.address || order.deliveryWindow || order.addressNeedsClarification) && (
          <div className="text-sm text-muted-foreground">
            <div>
              {order.address ? (
                <>
                  <span>{order.address}</span>
                  {order.addressNeedsClarification && (
                    <span className="inline-flex items-center gap-1 text-amber-600 ml-2">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Требует уточнения</span>
                    </span>
                  )}
                </>
              ) : order.addressNeedsClarification ? (
                <span className="text-amber-600">Адрес требует уточнения</span>
              ) : null}
            </div>
            {order.deliveryWindow && order.deliveryWindow.from && (
              <span>
                {new Date(order.deliveryWindow.from).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short'
                })} {format(new Date(order.deliveryWindow.from), "HH:mm")}-{format(new Date(order.deliveryWindow.to), "HH:mm")}
              </span>
            )}
          </div>
        )}

        {/* Товары */}
        {order.items && order.items.length > 0 && (
          <div className="text-sm">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index}>
                {item.productName} × {item.quantity}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-muted-foreground">
                еще {order.items.length - 3} товар{order.items.length - 3 === 1 ? '' : order.items.length - 3 < 5 ? 'а' : 'ов'}
              </div>
            )}
          </div>
        )}

        {/* Сумма и действия */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold">
            {((order.totalAmount || order.total) || 0).toLocaleString('ru-RU')} ₸
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
      </CardContent>
    </Card>
  )
}