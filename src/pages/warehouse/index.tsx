import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Package, Store, AlertTriangle } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { ResponsiveTable } from "@/components/ui/responsive-table"
import { PageFilters, createFilterOptions } from "@/components/ui/page-filters"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { WarehouseItem } from "@/lib/types"
import { VARIETIES, FARMS, SUPPLIERS, HEIGHTS } from "@/lib/constants"
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
  const [heightFilter, setHeightFilter] = useState<string>("all")
  const [farmFilter, setFarmFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [flagFilter, setFlagFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null)
  const [editPrice, setEditPrice] = useState("")
  const [editOnShowcase, setEditOnShowcase] = useState(false)
  const [editToWriteOff, setEditToWriteOff] = useState(false)
  const [editHidden, setEditHidden] = useState(false)

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
      heightFilter, 
      farmFilter, 
      supplierFilter, 
      flagFilter, 
      debouncedSearchQuery, 
      currentPage
    ],
    queryFn: async () => {
      const response = await warehouseApi.getItems({
        variety: varietyFilter === 'all' ? undefined : varietyFilter,
        heightCm: heightFilter === 'all' ? undefined : parseInt(heightFilter),
        farm: farmFilter === 'all' ? undefined : farmFilter,
        supplier: supplierFilter === 'all' ? undefined : supplierFilter,
        onShowcase: flagFilter === 'showcase' ? true : undefined,
        toWriteOff: flagFilter === 'writeoff' ? true : undefined,
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
      setEditingItem(null)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Ошибка при обновлении позиции'
      toast.error(message)
    }
  })

  const handleQuickEdit = (item: WarehouseItem) => {
    setEditingItem(item)
    setEditPrice(item.price.toString())
    setEditOnShowcase(item.onShowcase)
    setEditToWriteOff(item.toWriteOff)
    setEditHidden(item.hidden)
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        updates: {
          price: parseFloat(editPrice),
          onShowcase: editOnShowcase,
          toWriteOff: editToWriteOff,
          hidden: editHidden
        }
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateTotalCost = (item: WarehouseItem) => {
    return item.cost * item.rate
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
          searchPlaceholder: "Поиск по SKU или партии",
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
            },
            {
              value: heightFilter,
              onChange: (value) => {
                setHeightFilter(value)
                setCurrentPage(1)
              },
              placeholder: "Вся высота",
              options: [
                { value: "all", label: "Вся высота" },
                ...HEIGHTS.map(height => ({ value: height.toString(), label: `${height} см` }))
              ],
              width: "sm:w-[140px]"
            }
          ],
          advancedFilters: {
            trigger: "Фильтры",
            content: (
              <>
                <DropdownMenuLabel>Фермы</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {createFilterOptions(FARMS, "Все фермы").map(farm => (
                  <DropdownMenuItem
                    key={farm.value}
                    onClick={() => {
                      setFarmFilter(farm.value)
                      setCurrentPage(1)
                    }}
                    className={farmFilter === farm.value ? "bg-accent" : ""}
                  >
                    {farm.label}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Поставщики</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {createFilterOptions(SUPPLIERS, "Все поставщики").map(supplier => (
                  <DropdownMenuItem
                    key={supplier.value}
                    onClick={() => {
                      setSupplierFilter(supplier.value)
                      setCurrentPage(1)
                    }}
                    className={supplierFilter === supplier.value ? "bg-accent" : ""}
                  >
                    {supplier.label}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Флаги</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { value: "all", label: "Все флаги" },
                  { value: "showcase", label: "На витрине" },
                  { value: "writeoff", label: "К списанию" },
                  { value: "hidden", label: "Скрытые" }
                ].map(flag => (
                  <DropdownMenuItem
                    key={flag.value}
                    onClick={() => {
                      setFlagFilter(flag.value)
                      setCurrentPage(1)
                    }}
                    className={flagFilter === flag.value ? "bg-accent" : ""}
                  >
                    {flag.label}
                  </DropdownMenuItem>
                ))}
              </>
            )
          }
        }}
      />

      {/* Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'sku',
            label: 'SKU',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="font-medium">{value as string}</div>
                <div className="text-xs text-muted-foreground">
                  {item.batchCode}
                </div>
              </div>
            ),
            priority: 0
          },
          {
            key: 'variety',
            label: 'Номенклатура',
            render: (value, item) => (
              <div className="space-y-1">
                <div>{value as string} {item.heightCm}см</div>
                <div className="text-xs text-muted-foreground">
                  {item.farm}
                </div>
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
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formatCurrency(value as number)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Наценка: {item.markupPct}%
                </div>
              </div>
            ),
            priority: 3
          },
          {
            key: 'deliveryDate',
            label: 'Поставка',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm">
                  {new Date(value as Date).toLocaleDateString('ru-KZ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.supplier}
                </div>
              </div>
            ),
            hideOnMobile: true
          },
          {
            key: 'cost',
            label: 'Экономика',
            render: (value, item) => (
              <div className="space-y-1">
                <div className="text-sm">
                  Себест: {formatCurrency(calculateTotalCost(item))}
                </div>
                <div className="text-sm font-medium">
                  Цена: {formatCurrency(item.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Наценка: {item.markupPct}%
                </div>
              </div>
            ),
            hideOnMobile: true
          },
          {
            key: 'onShowcase',
            label: 'Флаги',
            render: (_, item) => (
              <div className="flex gap-2 flex-wrap">
                {item.onShowcase && (
                  <Badge variant="secondary">
                    <Store className="mr-1 h-3 w-3" />
                    На витрине
                  </Badge>
                )}
                {item.toWriteOff && (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    К списанию
                  </Badge>
                )}
                {item.hidden && (
                  <Badge variant="outline">Скрыто</Badge>
                )}
              </div>
            ),
            hideOnMobile: true
          }
        ]}
        mobileCardTitle={(item) => `${item.sku}`}
        mobileCardSubtitle={(item) => `${item.variety} ${item.heightCm}см`}
        onRowClick={(item) => navigate(`/warehouse/${item.id}`)}
        mobileCardActions={(item) => (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuickEdit(item)}
                className="h-8 w-8"
              >
                <Package className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Быстрое редактирование</DialogTitle>
                <DialogDescription>
                  {item.sku} - {item.variety} {item.heightCm}см
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Цена
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Флаги</Label>
                  <div className="col-span-3 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editOnShowcase}
                        onChange={(e) => setEditOnShowcase(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>На витрине</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editToWriteOff}
                        onChange={(e) => setEditToWriteOff(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>К списанию</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editHidden}
                        onChange={(e) => setEditHidden(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Скрыто</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />
    </div>
  )
}