import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { WarehouseMobileCard } from "@/components/warehouse/mobile-card"
import { toast } from "sonner"
import { Package } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { ResponsiveTable } from "@/components/ui/responsive-table"
import { PageFilters, createFilterOptions } from "@/components/ui/page-filters"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { WarehouseItem } from "@/lib/types"
import { VARIETIES } from "@/lib/constants"
import { warehouseApi } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"

// API response type
interface WarehouseItemApiResponse {
  id: number
  sku: string
  batch_code: string
  variety: string
  height_cm: number
  farm: string
  supplier: string
  delivery_date: string
  currency: string
  rate: number
  cost: number
  markup_pct: number
  qty: number
  price: number
  reserved_qty: number
  recommended_price: number
  on_showcase: boolean
  to_write_off: boolean
  hidden: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
  available_qty: number
  is_critical_stock: boolean
}

export function WarehousePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [varietyFilter, setVarietyFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query for warehouse items
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'warehouse', 
      varietyFilter, 
      debouncedSearchQuery, 
      currentPage
    ],
    queryFn: async () => {
      const response = await warehouseApi.getItems({
        variety: varietyFilter === 'all' ? undefined : varietyFilter,
        search: debouncedSearchQuery || undefined,
        page: currentPage,
        limit: 20
      })

      // Convert snake_case API response to camelCase
      const rawResponse = response as unknown as { items: WarehouseItemApiResponse[], total: number }
      return {
        total: rawResponse.total,
        items: rawResponse.items.map((item) => ({
          id: item.id.toString(),
          sku: item.sku,
          batchCode: item.batch_code,
          variety: item.variety,
          heightCm: item.height_cm,
          farm: item.farm,
          supplier: item.supplier,
          deliveryDate: new Date(item.delivery_date),
          currency: item.currency as 'USD' | 'EUR' | 'KZT',
          rate: item.rate,
          cost: item.cost,
          recommendedPrice: item.recommended_price,
          price: item.price,
          markupPct: item.markup_pct,
          qty: item.qty,
          reservedQty: item.reserved_qty,
          onShowcase: item.on_showcase,
          toWriteOff: item.to_write_off,
          hidden: item.hidden,
          updatedAt: new Date(item.updated_at),
          updatedBy: item.updated_by || 'system'
        })) as WarehouseItem[]
      }
    }
  })

  // Mutation for updating item
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WarehouseItem> }) => {
      // Convert camelCase to snake_case for API
      const apiUpdates: any = {}
      if (updates.price !== undefined) apiUpdates.price = updates.price
      if (updates.onShowcase !== undefined) apiUpdates.on_showcase = updates.onShowcase
      if (updates.toWriteOff !== undefined) apiUpdates.to_write_off = updates.toWriteOff
      if (updates.hidden !== undefined) apiUpdates.hidden = updates.hidden
      apiUpdates.updated_by = 'user' // Will be replaced with actual user when auth is implemented

      return warehouseApi.updateItem(id, apiUpdates)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      toast.success(`Позиция обновлена`)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Ошибка при обновлении позиции'
      toast.error(message)
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStockStatusColor = (qty: number, reservedQty: number): string => {
    const available = qty - reservedQty
    if (available <= 15) return "text-destructive"
    if (available <= 30) return "text-orange-500"
    return ""
  }

  // Calculate pagination
  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const items = data?.items || []

  // Loading and Error states
  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return <ErrorState 
      message={error instanceof Error ? error.message : 'Ошибка загрузки остатков'} 
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['warehouse'] })} 
    />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Остатки склада</h1>
      </div>

      {/* Filters */}
      <PageFilters
        config={{
          searchPlaceholder: "Поиск по названию",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          selectFilters: [
            {
              value: varietyFilter,
              onChange: (value) => {
                setVarietyFilter(value)
                setCurrentPage(1)
              },
              placeholder: "Все сорта",
              options: createFilterOptions(VARIETIES, "Все сорта"),
              width: "sm:w-[160px]"
            }
          ]
        }}
      />

      {/* Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'variety',
            label: 'Номенклатура',
            render: (value, item) => (
              <div className="space-y-1">
                <div>{value as string} {item.heightCm}см</div>
              </div>
            ),
            priority: 1
          },
          {
            key: 'qty',
            label: 'Остатки',
            render: (value, item) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1">
                      <div className={`text-sm font-medium ${getStockStatusColor(item.qty, item.reservedQty)}`}>
                        {value as number} шт
                      </div>
                      {item.reservedQty > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Резерв: {item.reservedQty} шт
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Доступно: {item.qty - item.reservedQty} шт</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ),
            priority: 2
          },
          {
            key: 'price',
            label: 'Цена',
            render: (value) => (
              <div className="text-sm font-medium">
                {formatCurrency(value as number)}
              </div>
            ),
            priority: 3
          },
          {
            key: 'deliveryDate',
            label: 'Поставка',
            render: (value) => (
              <div className="text-sm">
                {new Date(value as Date).toLocaleDateString('ru-KZ')}
              </div>
            ),
            hideOnMobile: true
          },
        ]}
        mobileCardRender={(item, onClick) => (
          <WarehouseMobileCard item={item} onClick={onClick} />
        )}
        onRowClick={(item) => navigate(`/warehouse/${item.id}`)}
      />
    </div>
  )
}