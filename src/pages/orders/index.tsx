import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Search, MoreHorizontal, Eye, AlertTriangle, Package, Plus } from "lucide-react"
import { toast } from "sonner"

import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import type { Order } from "@/lib/types"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DATETIME_FORMAT } from "@/lib/constants"

// Mock data
const mockOrders: Order[] = [
  {
    id: "1",
    createdAt: new Date("2024-01-26T10:00:00"),
    status: "paid",
    customerPhone: "+7 (707) 123-45-67",
    recipientPhone: "+7 (701) 234-56-78",
    recipientName: "Айгерим",
    address: "ул. Абая 150, кв 25",
    deliveryMethod: "delivery",
    deliveryWindow: {
      from: new Date("2024-01-26T14:00:00"),
      to: new Date("2024-01-26T16:00:00")
    },
    flowerSum: 15000,
    deliveryFee: 1500,
    total: 16500,
    hasPreDeliveryPhotos: false,
    hasIssue: false,
    trackingToken: "ABC123",
    updatedAt: new Date("2024-01-26T10:00:00")
  },
  {
    id: "2",
    createdAt: new Date("2024-01-26T11:30:00"),
    status: "assembled",
    customerPhone: "+7 (777) 890-12-34",
    recipientName: "Самат",
    deliveryMethod: "self_pickup",
    deliveryWindow: {
      from: new Date("2024-01-26T18:00:00"),
      to: new Date("2024-01-26T19:00:00")
    },
    flowerSum: 25000,
    deliveryFee: 0,
    total: 25000,
    hasPreDeliveryPhotos: true,
    hasIssue: false,
    trackingToken: "XYZ789",
    updatedAt: new Date("2024-01-26T12:00:00")
  },
  {
    id: "3",
    createdAt: new Date("2024-01-26T09:00:00"),
    status: "issue",
    customerPhone: "+7 (701) 555-44-33",
    recipientPhone: "+7 (777) 666-77-88",
    recipientName: "Динара",
    address: "мкр. Самал-2, д. 77",
    deliveryMethod: "delivery",
    deliveryWindow: {
      from: new Date("2024-01-26T12:00:00"),
      to: new Date("2024-01-26T14:00:00")
    },
    flowerSum: 18000,
    deliveryFee: 2000,
    total: 20000,
    hasPreDeliveryPhotos: true,
    hasIssue: true,
    issueType: "recipient_unavailable",
    trackingToken: "DEF456",
    updatedAt: new Date("2024-01-26T13:00:00")
  }
]

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders] = useState<Order[]>(mockOrders)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    toast.success(`Статус заказа #${orderId} изменен на "${ORDER_STATUS_LABELS[newStatus]}"`)
  }

  const handleMarkIssue = (orderId: string) => {
    toast.info(`Открыта форма для пометки проблемы заказа #${orderId}`)
  }

  const handleOpenTracking = (trackingToken: string) => {
    window.open(`/tracking/${trackingToken}`, '_blank')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <Button onClick={() => navigate('/orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Новый заказ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd.MM.yy")} -{" "}
                    {format(dateRange.to, "dd.MM.yy")}
                  </>
                ) : (
                  format(dateRange.from, "dd.MM.yy")
                )
              ) : (
                <span>Выберите даты</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => setDateRange({ 
                from: range?.from, 
                to: range?.to 
              })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по телефону или ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <ResponsiveTable
        data={orders}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
        columns={[
          {
            key: 'id',
            label: 'ID',
            render: (value) => `#${value}`,
            priority: 1
          },
          {
            key: 'createdAt',
            label: 'Дата/Время',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm">
                  {format(value as Date, DATETIME_FORMAT)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.deliveryWindow && (
                    <>
                      {format(item.deliveryWindow.from, "HH:mm")} - 
                      {format(item.deliveryWindow.to, "HH:mm")}
                    </>
                  )}
                </div>
              </div>
            ),
            priority: 2
          },
          {
            key: 'status',
            label: 'Статус',
            render: (value) => (
              <Badge variant={ORDER_STATUS_COLORS[value as Order['status']]}>
                {ORDER_STATUS_LABELS[value as Order['status']]}
              </Badge>
            ),
            priority: 0
          },
          {
            key: 'customerPhone',
            label: 'Контакты',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm">{value as string}</div>
                {item.recipientPhone && (
                  <div className="text-xs text-muted-foreground">
                    Получатель: {item.recipientName || item.recipientPhone}
                  </div>
                )}
              </div>
            ),
            hideOnMobile: true
          },
          {
            key: 'deliveryMethod',
            label: 'Доставка',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm">
                  {value === 'delivery' ? 'Доставка' : 'Самовывоз'}
                </div>
                {item.address && (
                  <div className="text-xs text-muted-foreground">
                    {item.address}
                  </div>
                )}
              </div>
            ),
            priority: 3
          },
          {
            key: 'total',
            label: 'Сумма',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formatCurrency(value as number)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Цветы: {formatCurrency(item.flowerSum)}
                </div>
              </div>
            ),
            priority: 4
          },
          {
            key: 'hasIssue',
            label: 'Признаки',
            render: (value, item) => (
              <div className="flex gap-2">
                {item.hasPreDeliveryPhotos && (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
                {item.hasIssue && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            ),
            hideOnMobile: true
          }
        ]}
        mobileCardTitle={(order) => `Заказ #${order.id}`}
        mobileCardSubtitle={(order) => format(order.createdAt, DATETIME_FORMAT)}
        mobileCardActions={(order) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleOpenTracking(order.trackingToken)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Открыть трекинг
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(order.id, status as Order['status'])}
                >
                  Статус: {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleMarkIssue(order.id)}
                className="text-destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Пометить проблему
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}