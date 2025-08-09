import { useState, useEffect } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Eye, AlertTriangle, Package, Plus, Search, Calendar as CalendarIcon, Copy } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { ResponsiveTable } from "@/components/ui/responsive-table"
import { PageFilters, createFilterOptionsFromObject } from "@/components/ui/page-filters"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderCard } from "@/components/orders/order-card"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Order, OrderItem, User } from "@/lib/types"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DATETIME_FORMAT, FORM_WIDTHS } from "@/lib/constants"
import { ordersApi } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { ErrorState } from "@/components/ui/error-alert"

// Remove mock data - now using real API data

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
  items?: OrderItem[]
  assigned_florist?: {
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
}

export function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const isTablet = useMediaQuery("(max-width: 768px)")
  
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
          totalAmount: order.total, // Add totalAmount field
          hasPreDeliveryPhotos: order.has_pre_delivery_photos,
          hasIssue: order.has_issue,
          issueType: order.issue_type as Order['issueType'] | undefined,
          trackingToken: order.tracking_token,
          items: order.items || [],
          assignedTo: order.assigned_florist ? {
            id: String(order.assigned_florist.id),
            name: order.assigned_florist.name,
            role: "florist" as const
          } : undefined,
          customer: order.customer
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
    window.open(`/status/${trackingToken}`, '_blank')
  }

  const handleCopyTrackingLink = (trackingToken: string) => {
    const trackingUrl = `${window.location.origin}/status/${trackingToken}`
    navigator.clipboard.writeText(trackingUrl)
    toast.success("Ссылка для отслеживания скопирована")
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
        <Button onClick={() => navigate('/orders/new')} data-testid="new-order-button">
          <Plus className="mr-2 h-4 w-4" />
          Новый заказ
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('all')
              setCurrentPage(1)
            }}
            data-testid="filter-all"
          >
            Все
          </Button>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              data-testid={`filter-${value}`}
            >
              {label}
            </Button>
          ))}
        </div>
        
        {/* Search and date filter */}
        <div className="flex gap-2">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${FORM_WIDTHS.SEARCH}`}
              data-testid="search-input"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // This would open date picker
              toast.info("Выбор даты будет реализован")
            }}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table or Cards */}
      {isTablet ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <ResponsiveTable
          data={orders}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
          data-testid="orders-table"
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
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleOpenTracking(order.trackingToken)}
              className="h-8 w-8"
              title="Открыть трекинг"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleCopyTrackingLink(order.trackingToken)}
              className="h-8 w-8"
              title="Скопировать ссылку трекинга"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`order-menu-${order.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Статус заказа</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(order.id, status as Order['status'])}
                    className={order.status === status ? "bg-accent" : ""}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleCopyTrackingLink(order.trackingToken)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Скопировать ссылку трекинга
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleMarkIssue(order.id)}
                  className="text-destructive"
                  data-testid="mark-issue"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Пометить проблему
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent className={isMobile ? "gap-1" : ""}>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {!isMobile && (
              <>
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
              </>
            )}

            {/* Mobile pagination - show only current page */}
            {isMobile && (
              <PaginationItem>
                <span className="px-3 py-2 text-sm">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>
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
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} data-testid="issue-dialog">
        <DialogContent className={FORM_WIDTHS.FORM_DIALOG}>
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
                <SelectTrigger id="issue-type" className={FORM_WIDTHS.STATUS} data-testid="issue-type-select">
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
                className={FORM_WIDTHS.COMMENT}
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
              data-testid="save-issue-button"
            >
              {issueMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}