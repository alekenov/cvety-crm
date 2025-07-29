import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { 
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Edit2,
  AlertTriangle,
  Eye,
  EyeOff,
  Store,
  Truck,
  Calendar,
  DollarSign,
  BarChart3,
  History,
  Plus,
  Minus,
  RefreshCw,
  Check
} from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMediaQuery } from "@/hooks/use-media-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

import type { WarehouseItem } from "@/lib/types"
import { warehouseApi } from "@/lib/api"

interface MovementHistory {
  id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  description: string
  orderId?: string
  createdAt: Date
  createdBy: string
}

export function WarehouseItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  const [editSheet, setEditSheet] = useState<"price" | "stock" | "flags" | null>(null)
  const [priceValue, setPriceValue] = useState("")
  const [adjustmentValue, setAdjustmentValue] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  // Fetch warehouse item data
  const { data: item, isLoading } = useQuery({
    queryKey: ['warehouse-item', id],
    queryFn: async () => {
      if (!id) throw new Error('No item ID')
      return warehouseApi.getById(id)
    },
    enabled: !!id
  })

  // Mock movement history - in real app this would be an API call
  const movements: MovementHistory[] = [
    {
      id: '1',
      type: 'out',
      quantity: 5,
      description: 'Продажа',
      orderId: '123',
      createdAt: new Date('2024-01-26T14:30:00'),
      createdBy: 'Система'
    },
    {
      id: '2',
      type: 'in',
      quantity: 50,
      description: 'Поставка',
      createdAt: new Date('2024-01-22T10:00:00'),
      createdBy: 'Админ'
    },
    {
      id: '3',
      type: 'adjustment',
      quantity: -2,
      description: 'Списание (повреждение)',
      createdAt: new Date('2024-01-20T16:45:00'),
      createdBy: 'Флорист'
    }
  ]

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ updates }: { updates: Partial<WarehouseItem> }) => {
      if (!id) throw new Error('No item ID')
      return warehouseApi.updateItem(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-item', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      toast.success('Изменения сохранены')
      setEditSheet(null)
    },
    onError: (error) => {
      toast.error('Ошибка при сохранении')
      console.error(error)
    }
  })

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: ({ adjustment, reason }: { adjustment: number; reason: string }) => {
      if (!id || !item) throw new Error('No item data')
      
      // In real app, this would be a specific endpoint for stock adjustments
      return warehouseApi.updateItem(id, {
        qty: item.qty + adjustment,
        updated_by: 'current_user' // Will be replaced with actual user
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-item', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      toast.success('Остаток обновлен')
      setEditSheet(null)
      setAdjustmentValue("")
      setAdjustmentReason("")
    },
    onError: (error) => {
      toast.error('Ошибка при корректировке остатка')
      console.error(error)
    }
  })

  useEffect(() => {
    if (item) {
      setPriceValue(item.price.toString())
    }
  }, [item])

  const handlePriceUpdate = () => {
    const newPrice = parseFloat(priceValue)
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('Введите корректную цену')
      return
    }
    
    updateMutation.mutate({
      updates: { price: newPrice }
    })
  }

  const handleStockAdjustment = () => {
    const adjustment = parseInt(adjustmentValue)
    if (isNaN(adjustment) || adjustment === 0) {
      toast.error('Введите корректное количество')
      return
    }
    
    if (!adjustmentReason.trim()) {
      toast.error('Укажите причину корректировки')
      return
    }
    
    adjustStockMutation.mutate({
      adjustment,
      reason: adjustmentReason
    })
  }

  const handleFlagToggle = (flag: 'onShowcase' | 'toWriteOff' | 'hidden') => {
    if (!item) return
    
    updateMutation.mutate({
      updates: { [flag]: !item[flag] }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return 'Неизвестно'
      }
      return format(dateObj, "dd.MM.yyyy")
    } catch {
      return 'Неизвестно'
    }
  }

  const getStockLevel = (qty: number, reserved: number) => {
    const available = qty - reserved
    const percentage = (available / qty) * 100
    
    if (percentage <= 15) return { color: 'destructive', label: 'Критический' }
    if (percentage <= 30) return { color: 'warning', label: 'Низкий' }
    return { color: 'success', label: 'Нормальный' }
  }

  const calculateMarkup = (cost: number, price: number) => {
    return ((price - cost) / cost * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Товар не найден</p>
          <Button onClick={() => navigate("/warehouse")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    )
  }

  const available = item.qty - item.reservedQty
  const stockLevel = getStockLevel(item.qty, item.reservedQty)
  const totalCost = item.cost * item.rate
  const markup = calculateMarkup(totalCost, item.price)

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/warehouse")}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{item.sku}</h1>
                <p className="text-sm text-muted-foreground">{item.batchCode}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditSheet("flags")}
              className="h-10 w-10"
            >
              <Edit2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{item.variety} {item.heightCm}см</h2>
            <p className="text-muted-foreground">{item.farm}</p>
          </div>

          {/* Stock Indicator */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{item.qty}</p>
                  <p className="text-sm text-muted-foreground">Всего</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-500">{item.reservedQty}</p>
                  <p className="text-sm text-muted-foreground">Резерв</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Доступно:</span>
                  <span className="font-bold text-lg">{available} шт</span>
                </div>
                <Progress 
                  value={(available / item.qty) * 100} 
                  className="h-2"
                />
                <Badge variant={stockLevel.color as any} className="w-full justify-center">
                  {stockLevel.label} уровень остатка
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Price & Economics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Цена и экономика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Себестоимость:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Цена продажи:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-bold text-lg p-0 h-auto"
                    onClick={() => setEditSheet("price")}
                  >
                    {formatCurrency(item.price)}
                    <Edit2 className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Наценка:</span>
                  <Badge variant="secondary">{markup}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Информация о партии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Партия:</span>
                  <span>{item.batchCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Поставка:</span>
                  <span>{formatDate(item.deliveryDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Поставщик:</span>
                  <span>{item.supplier}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => setEditSheet("stock")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Корректировка
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => handleFlagToggle('onShowcase')}
            >
              {item.onShowcase ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Убрать
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 mr-2" />
                  На витрину
                </>
              )}
            </Button>
          </div>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                История движения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      movement.type === 'in' ? 'bg-green-100 text-green-600' :
                      movement.type === 'out' ? 'bg-red-100 text-red-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {movement.type === 'in' ? <TrendingUp className="h-4 w-4" /> :
                       movement.type === 'out' ? <TrendingDown className="h-4 w-4" /> :
                       <RefreshCw className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity} шт
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(movement.createdAt, "dd.MM HH:mm")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{movement.description}</p>
                      {movement.orderId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => navigate(`/orders/${movement.orderId}`)}
                        >
                          Заказ #{movement.orderId}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={item.toWriteOff ? "default" : "outline"}
              onClick={() => handleFlagToggle('toWriteOff')}
            >
              {item.toWriteOff ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  К списанию
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Списать
                </>
              )}
            </Button>
            <Button
              variant={item.hidden ? "default" : "outline"}
              onClick={() => handleFlagToggle('hidden')}
            >
              {item.hidden ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Показать
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Скрыть
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Edit Sheets */}
        {/* Price Edit Sheet */}
        <Sheet open={editSheet === "price"} onOpenChange={(open) => !open && setEditSheet(null)}>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>Изменить цену</SheetTitle>
              <SheetDescription>
                Текущая цена: {formatCurrency(item.price)}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="price">Новая цена (₸)</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Введите новую цену"
                  className="text-lg"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Себестоимость: {formatCurrency(totalCost)}</p>
                <p>Новая наценка: {priceValue ? calculateMarkup(totalCost, parseFloat(priceValue)) : '0'}%</p>
              </div>
              <Button 
                className="w-full" 
                onClick={handlePriceUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Stock Adjustment Sheet */}
        <Sheet open={editSheet === "stock"} onOpenChange={(open) => !open && setEditSheet(null)}>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Корректировка остатка</SheetTitle>
              <SheetDescription>
                Текущий остаток: {item.qty} шт
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAdjustmentValue(v => {
                    const current = parseInt(v) || 0
                    return (current - 1).toString()
                  })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAdjustmentValue(v => {
                    const current = parseInt(v) || 0
                    return (current + 1).toString()
                  })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label htmlFor="adjustment">Изменение количества</Label>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="Например: -5 или +10"
                  className="text-lg text-center"
                />
              </div>
              <div>
                <Label htmlFor="reason">Причина корректировки</Label>
                <Input
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Например: Повреждение при хранении"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Будет: {item.qty + (parseInt(adjustmentValue) || 0)} шт</p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleStockAdjustment}
                disabled={adjustStockMutation.isPending}
              >
                {adjustStockMutation.isPending ? 'Сохранение...' : 'Применить'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop view (keeping existing desktop layout)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/warehouse")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{item.sku}</h1>
            <p className="text-muted-foreground">
              {item.variety} {item.heightCm}см • {item.batchCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доступно</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{available} шт</div>
            <p className="text-xs text-muted-foreground">
              Всего: {item.qty} • Резерв: {item.reservedQty}
            </p>
            <Progress 
              value={(available / item.qty) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Цена продажи</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(item.price)}</div>
            <p className="text-xs text-muted-foreground">
              Себестоимость: {formatCurrency(totalCost)}
            </p>
            <Badge variant="secondary" className="mt-2">
              Наценка: {markup}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Поставка</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(item.deliveryDate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.supplier}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обновлено</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(item.updatedAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.updatedBy}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content continues with desktop layout... */}
    </div>
  )
}