import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTelegram } from '../providers/TelegramProvider'
import axios from 'axios'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function similar to main app's cn
const cn = (...inputs: (string | undefined)[]) => {
  return twMerge(clsx(inputs))
}

// Basic types (simplified versions from main app)
interface Product {
  id: number
  name: string
  category: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice: number
  retailPrice: number
  salePrice?: number
  isActive: boolean
  isPopular: boolean
  isNew: boolean
  createdAt: string
  updatedAt: string
  currentPrice?: number
  discountPercentage?: number
}

interface ProductUpdate {
  name?: string
  category?: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice?: number
  retailPrice?: number
  salePrice?: number
  isActive?: boolean
  isPopular?: boolean
  isNew?: boolean
}

// Icons
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Package, 
  AlertCircle, 
  Edit2, 
  Eye, 
  EyeOff,
  Heart,
  Star,
  ImageOff,
  Filter
} from 'lucide-react'

interface ProductsResponse {
  products: Product[]
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
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
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
  <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
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
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'text-foreground border border-input bg-background'
  }
  
  return (
    <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)}>
      {children}
    </div>
  )
}

const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '', 
  ...props 
}: {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  [key: string]: any
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
)

// Product category labels in Russian
const categoryLabels = {
  bouquet: 'Букеты',
  composition: 'Композиции',
  potted: 'Горшечные',
  other: 'Другое'
}

// Skeleton component for loading state
const ProductSkeleton = () => (
  <div className="animate-pulse">
    <Card className="mb-3 p-3">
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
)

// Empty state component
const EmptyState = ({ searchQuery }: { searchQuery: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    {searchQuery ? (
      <>
        <Search className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ничего не найдено</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          По запросу "{searchQuery}" товары не найдены
        </p>
      </>
    ) : (
      <>
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет товаров</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Товары будут отображаться здесь после добавления
        </p>
      </>
    )}
    <Button variant="outline" className="min-w-[120px]">
      <Plus className="h-4 w-4 mr-2" />
      Добавить товар
    </Button>
  </div>
)

// Product card component
const ProductCard = ({ 
  product, 
  onEdit, 
  onToggleActive 
}: { 
  product: Product
  onEdit: (product: Product) => void
  onToggleActive: (product: Product) => void
}) => {
  const { haptic } = useTelegram()

  const handleEdit = useCallback(() => {
    haptic.impactOccurred('light')
    onEdit(product)
  }, [product, onEdit, haptic])

  const handleToggleActive = useCallback(() => {
    haptic.impactOccurred('medium')
    onToggleActive(product)
  }, [product, onToggleActive, haptic])

  const currentPrice = product.salePrice || product.retailPrice
  const hasDiscount = product.salePrice && product.salePrice < product.retailPrice

  return (
    <Card className="mb-3 p-3 transform transition-transform active:scale-95">
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 text-sm leading-tight truncate pr-2">
              {product.name}
            </h3>
            <Badge
              variant={product.isActive ? "default" : "secondary"}
              className="text-xs px-2 py-0.5"
            >
              {product.isActive ? 'Активен' : 'Скрыт'}
            </Badge>
          </div>

          {/* Category and badges */}
          <div className="flex gap-1 mb-2 flex-wrap">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {categoryLabels[product.category]}
            </Badge>
            {product.isPopular && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-orange-600 border-orange-200">
                <Heart className="h-3 w-3 mr-1" />
                Популярный
              </Badge>
            )}
            {product.isNew && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-green-600 border-green-200">
                <Star className="h-3 w-3 mr-1" />
                Новинка
              </Badge>
            )}
          </div>

          {/* Price and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-600 text-sm">
                {currentPrice.toLocaleString()} ₸
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-500 line-through">
                  {product.retailPrice.toLocaleString()} ₸
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleActive}
                className="h-7 w-7 p-0 text-gray-500"
              >
                {product.isActive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-7 w-7 p-0 text-gray-500"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export const ProductsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const { haptic } = useTelegram()
  const queryClient = useQueryClient()

  // API client setup
  const apiClient = axios.create({
    baseURL: 'http://localhost:8001'
  })

  // Fetch products
  const { 
    data, 
    isLoading, 
    refetch,
    isError 
  } = useQuery<ProductsResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get('/api/products')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & ProductUpdate) => {
      const response = await apiClient.put(`/api/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      haptic.notificationOccurred('success')
    },
    onError: () => {
      haptic.notificationOccurred('error')
    }
  })

  // Haptic feedback helper using the telegram provider
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

  // Search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    triggerHaptic('light')
  }, [triggerHaptic])

  // Category filter handler
  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category)
    triggerHaptic('light')
  }, [triggerHaptic])

  // Edit product handler
  const handleEditProduct = useCallback((product: Product) => {
    // Here you would open a modal or navigate to edit page
    // For now, just log
    console.log('Edit product:', product)
  }, [])

  // Toggle active status
  const handleToggleActive = useCallback((product: Product) => {
    updateProductMutation.mutate({
      id: product.id,
      isActive: !product.isActive
    })
  }, [updateProductMutation])

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []

    let filtered = data.products

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    return filtered
  }, [data?.products, searchQuery, selectedCategory])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: 0,
      bouquet: 0,
      composition: 0,
      potted: 0,
      other: 0
    }

    if (!data?.products) return counts

    counts.all = data.products.length

    data.products.forEach(product => {
      if (product.category in counts) {
        counts[product.category as keyof typeof counts]++
      }
    })

    return counts
  }, [data?.products])

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Не удалось загрузить товары. Проверьте подключение к интернету.
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
          <h1 className="text-xl font-semibold text-gray-900">Товары</h1>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 px-4 pb-3">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryFilter('all')}
            className="flex-shrink-0"
          >
            <Filter className="h-3 w-3 mr-1" />
            Все ({categoryCounts.all || 0})
          </Button>
          {Object.entries(categoryLabels).map(([category, label]) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryFilter(category)}
              className="flex-shrink-0"
            >
              {label} ({categoryCounts[category as keyof typeof categoryCounts] || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <EmptyState searchQuery={searchQuery} />
        )}

        {/* Products List */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {/* Pull-to-refresh indicator */}
        {refreshing && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg p-2 z-20">
            <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
          </div>
        )}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}

export default ProductsPage