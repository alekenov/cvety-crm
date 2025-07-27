import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Search, MoreHorizontal, Eye, AlertTriangle, Package, Plus } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { Order } from "@/lib/types"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DATETIME_FORMAT } from "@/lib/constants"
import { ordersApi } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"

// API response type
interface OrderApiResponse {
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
  has_pre_delivery_photos: boolean
  has_issue: boolean
  issue_type: string | null
  tracking_token: string
}

export function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // State
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [issueType, setIssueType] = useState<Order['issueType'] | ''>('')
  const [issueComment, setIssueComment] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query for orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', statusFilter, debouncedSearchQuery, dateRange, currentPage],
    queryFn: async () => {
      const response = await ordersApi.getAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearchQuery || undefined,
        dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        page: currentPage,
        limit: 20
      })
      
      // Convert snake_case API response to camelCase and date strings to Date objects
      // Type assertion is needed because API returns snake_case but our types expect camelCase
      const rawResponse = response as unknown as { items: OrderApiResponse[], total: number }
      return {
        total: rawResponse.total,
        items: rawResponse.items.map((order) => ({
          id: order.id.toString(),
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          status: order.status as Order['status'],
          customerPhone: order.customer_phone,
          recipientPhone: order.recipient_phone,
          recipientName: order.recipient_name,
          address: order.address,
          deliveryMethod: order.delivery_method as Order['deliveryMethod'],
          deliveryWindow: order.delivery_window ? {
            from: new Date(order.delivery_window.from),
            to: new Date(order.delivery_window.to)
          } : undefined,
          flowerSum: order.flower_sum,
          deliveryFee: order.delivery_fee,
          total: order.total,
          hasPreDeliveryPhotos: order.has_pre_delivery_photos,
          hasIssue: order.has_issue,
          issueType: order.issue_type as Order['issueType'] | undefined,
          trackingToken: order.tracking_token
        })) as Order[]
      }
    }
  })

  // Mutation for status update
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) => 
      ordersApi.updateStatus(orderId, status),
    onSuccess: (_, { orderId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(`Статус заказа #${orderId} изменен на "${ORDER_STATUS_LABELS[status]}"`)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Ошибка при обновлении статуса'
      toast.error(message)
    }
  })

  // Mutation for marking issue
  const issueMutation = useMutation({
    mutationFn: ({ orderId, issueType, comment }: { orderId: string; issueType: Order['issueType']; comment: string }) => 
      ordersApi.markIssue(orderId, issueType, comment),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(`Проблема отмечена для заказа #${orderId}`)
      setIssueDialogOpen(false)
      setSelectedOrderId(null)
      setIssueType('')
      setIssueComment('')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Ошибка при отметке проблемы'
      toast.error(message)
    }
  })

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    statusMutation.mutate({ orderId, status: newStatus })
  }

  const handleMarkIssue = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIssueDialogOpen(true)
  }

  const handleSubmitIssue = () => {
    if (selectedOrderId && issueType) {
      issueMutation.mutate({
        orderId: selectedOrderId,
        issueType: issueType as Order['issueType'],
        comment: issueComment
      })
    }
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

  // Calculate pagination
  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const orders = data?.items || []

  // Loading and Error states
  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return <ErrorState message={error instanceof Error ? error.message : 'Ошибка загрузки заказов'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['orders'] })} />
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
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}>
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
              onSelect={(range) => {
                setDateRange({ 
                  from: range?.from, 
                  to: range?.to 
                })
                setCurrentPage(1)
              }}
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
            render: (_, item) => (
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
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {/* Show first page */}
            {currentPage > 2 && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            
            {/* Show current page and neighbors */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (page === currentPage) return true
                if (page === currentPage - 1 && page > 0) return true
                if (page === currentPage + 1 && page <= totalPages) return true
                return false
              })
              .map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            
            {/* Show last page */}
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отметить проблему</DialogTitle>
            <DialogDescription>
              Опишите проблему с заказом #{selectedOrderId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="issue-type">Тип проблемы</Label>
              <Select value={issueType} onValueChange={(value) => setIssueType(value as Order['issueType'])}>
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Выберите тип проблемы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recipient_unavailable">Получатель недоступен</SelectItem>
                  <SelectItem value="wrong_address">Неверный адрес</SelectItem>
                  <SelectItem value="delivery_refused">Отказ от доставки</SelectItem>
                  <SelectItem value="quality_issue">Проблема с качеством</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issue-comment">Комментарий</Label>
              <Textarea
                id="issue-comment"
                value={issueComment}
                onChange={(e) => setIssueComment(e.target.value)}
                placeholder="Опишите проблему подробнее..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmitIssue} 
              disabled={!issueType || issueMutation.isPending}
            >
              {issueMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}