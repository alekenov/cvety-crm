import React, { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useTelegram } from '../providers/TelegramProvider'

// Utility function
const cn = (...inputs: (string | undefined)[]) => {
  return twMerge(clsx(inputs))
}

// Types
type OrderStatus = 
  | 'new' 
  | 'paid' 
  | 'assembled' 
  | 'delivery' 
  | 'self_pickup' 
  | 'issue'

interface Order {
  id: string
  status: OrderStatus
  customerPhone: string
  total: number
  createdAt: string
}

// Icons
import { RefreshCw, Package, AlertCircle, CheckCircle2, Truck } from 'lucide-react'

interface OrdersResponse {
  orders: Order[]
  total: number
}

// Simple UI Components (inline to avoid import issues)
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm'
  className?: string
  [key: string]: any
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    outline: 'border border-gray-300 bg-background hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm', className)}>
    {children}
  </div>
)

const Badge = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline'
  className?: string 
}) => {
  const variants = {
    default: 'bg-purple-600 text-white',
    secondary: 'bg-gray-100 text-gray-900',
    outline: 'text-gray-900 border border-gray-300 bg-white'
  }
  
  return (
    <div className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}>
      {children}
    </div>
  )
}

// Skeleton component for loading state
const OrderSkeleton = () => (
  <div className="animate-pulse">
    <Card className="mb-4 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 rounded"></div>
          <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  </div>
)

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <Package className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет заказов</h3>
    <p className="text-sm text-gray-500 text-center mb-6">
      Заказы будут отображаться здесь после их создания
    </p>
    <Button variant="outline" className="min-w-[120px]">
      Обновить
    </Button>
  </div>
)

// Order status configuration
const statusConfig = {
  new: { 
    label: 'Новые', 
    color: 'bg-blue-500', 
    icon: AlertCircle,
    count: 0 
  },
  paid: { 
    label: 'Оплаченные', 
    color: 'bg-green-500', 
    icon: CheckCircle2,
    count: 0 
  },
  assembled: { 
    label: 'Собранные', 
    color: 'bg-purple-500', 
    icon: Package,
    count: 0 
  },
  delivery: { 
    label: 'Доставка', 
    color: 'bg-orange-500', 
    icon: Truck,
    count: 0 
  },
  self_pickup: { 
    label: 'Самовывоз', 
    color: 'bg-yellow-500', 
    icon: Package,
    count: 0 
  },
  issue: { 
    label: 'Проблемы', 
    color: 'bg-red-500', 
    icon: AlertCircle,
    count: 0 
  }
}

// Simple order card component
const OrderCard = ({ 
  order
}: { 
  order: Order
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{order.id.slice(-6)}</span>
          <Badge variant={order.status === 'new' ? 'default' : 'secondary'}>
            {statusConfig[order.status]?.label || order.status}
          </Badge>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {order.customerPhone}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">{order.total.toLocaleString()} ₸</span>
        <span className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Card>
  )
}

export const OrdersPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  
  const { haptic } = useTelegram()

  // API client setup
  const apiClient = axios.create({
    baseURL: 'http://localhost:8001'
  })

  // Fetch orders
  const { 
    data, 
    isLoading, 
    refetch,
    isError 
  } = useQuery<OrdersResponse>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiClient.get('/api/orders')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 2
  })

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      haptic.impactOccurred(type)
    } catch (error) {
      console.warn('Haptic feedback not available:', error)
    }
  }, [haptic])

  // Pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    triggerHaptic('medium')
    
    try {
      await refetch()
      triggerHaptic('light')
    } catch (error) {
      triggerHaptic('heavy')
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refetch, triggerHaptic])

  // Handle status filter change
  const handleStatusFilter = useCallback((status: OrderStatus | 'all') => {
    triggerHaptic('light')
    setSelectedStatus(status)
  }, [triggerHaptic])

  // Group orders by status
  const groupedOrders = React.useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {
      new: [],
      paid: [],
      assembled: [],
      delivery: [],
      self_pickup: [],
      issue: []
    }

    if (!data?.orders) return groups

    // Reset status counts
    Object.keys(statusConfig).forEach(status => {
      const key = status as OrderStatus
      if (statusConfig[key]) {
        statusConfig[key].count = 0
      }
    })

    data.orders.forEach(order => {
      if (groups[order.status]) {
        groups[order.status].push(order)
        if (statusConfig[order.status]) {
          statusConfig[order.status].count++
        }
      }
    })

    return groups
  }, [data?.orders])

  // Filter orders based on selected status
  const filteredOrders = React.useMemo(() => {
    if (!data?.orders) return []
    
    if (selectedStatus === 'all') {
      return data.orders
    }
    
    return groupedOrders[selectedStatus] || []
  }, [data?.orders, selectedStatus, groupedOrders])

  // Pull-to-refresh gesture setup
  useEffect(() => {
    let startY = 0
    let currentY = 0
    let pulling = false

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      pulling = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 0 && window.scrollY === 0 && !pulling && diff > 50) {
        pulling = true
        triggerHaptic('light')
      }
    }

    const handleTouchEnd = () => {
      if (pulling && !refreshing) {
        handleRefresh()
      }
      pulling = false
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleRefresh, refreshing, triggerHaptic])


  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Не удалось загрузить заказы. Проверьте подключение к интернету.
        </p>
        <Button onClick={handleRefresh} disabled={refreshing} className="min-w-[120px]">
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {refreshing ? 'Обновление...' : 'Повторить'}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-gray-900">Заказы</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              refreshing ? "animate-spin" : ""
            )} />
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 px-4 pb-3">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('all')}
            className="flex-shrink-0"
          >
            Все ({data?.orders?.length || 0})
          </Button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const IconComponent = config.icon
            return (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter(status as OrderStatus)}
                className="flex-shrink-0 gap-1"
              >
                <IconComponent className="h-3 w-3" />
                {config.label} ({config.count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <OrderSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && <EmptyState />}

        {/* Orders List */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="transform transition-transform active:scale-98">
                <OrderCard 
                  order={order}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pull-to-refresh indicator */}
        {refreshing && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg p-2 z-20">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}

export default OrdersPage