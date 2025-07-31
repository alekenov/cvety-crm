import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Edit2,
  RefreshCw
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
  DialogTrigger,
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

import type { WarehouseItem, MovementHistory } from "@/lib/types"
import { warehouseApi } from "@/lib/api"

export function WarehouseItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  const [editSheet, setEditSheet] = useState<"price" | "stock" | null>(null)
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

  // Fetch movement history
  const { data: movementsData } = useQuery({
    queryKey: ['warehouse-movements', id],
    queryFn: async () => {
      if (!id) throw new Error('No item ID')
      return warehouseApi.getMovements(id)
    },
    enabled: !!id
  })

  const movements = movementsData?.items || []

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
      if (!id) throw new Error('No item ID')
      
      return warehouseApi.adjustStock(id, {
        adjustment,
        reason,
        created_by: 'current_user' // Will be replaced with actual user
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-item', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-movements', id] })
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
  const totalCost = item.cost * item.rate
  const markup = calculateMarkup(totalCost, item.price)

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/warehouse")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{item.variety} {item.heightCm}см</h1>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          {/* Stock and Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Наличие и цена</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">{available} шт</p>
                <p className="text-sm text-muted-foreground">Доступно для продажи</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Цена:</span>
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
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Себестоимость:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Наценка:</span>
                  <Badge variant="secondary">{markup}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Supply Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Информация о поставке</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Поставщик</p>
                  <p className="font-medium">{item.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата поставки</p>
                  <p className="font-medium">{formatDate(item.deliveryDate)}</p>
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
              onClick={() => setEditSheet("price")}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Изменить цену
            </Button>
          </div>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">История движения</CardTitle>
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
              <div className="space-y-2">
                <Label htmlFor="price">Новая цена (₸)</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="1500"
                />
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md space-y-1">
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
              <div className="space-y-2">
                <Label htmlFor="adjustment">Изменение количества</Label>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="-5 или +10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Причина корректировки</Label>
                <Input
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Повреждение при хранении"
                />
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
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

  // Desktop view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/warehouse")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{item.variety} {item.heightCm}см</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Наличие и цена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{available} шт</p>
              <p className="text-sm text-muted-foreground">Доступно для продажи</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Цена:</span>
                <span className="text-lg font-semibold">{formatCurrency(item.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Себестоимость:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Наценка:</span>
                <Badge variant="secondary">{markup}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Информация о поставке</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Поставщик</p>
              <p className="font-medium">{item.supplier}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата поставки</p>
              <p className="font-medium">{formatDate(item.deliveryDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3 max-w-md">
        <Dialog open={editSheet === "stock"} onOpenChange={(open) => !open && setEditSheet(null)}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setEditSheet("stock")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Корректировка остатка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Корректировка остатка</DialogTitle>
              <DialogDescription>
                Текущий остаток: {item.qty} шт
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment">Изменение количества</Label>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="-5 или +10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Причина корректировки</Label>
                <Input
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Повреждение при хранении"
                />
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p>Будет: {item.qty + (parseInt(adjustmentValue) || 0)} шт</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleStockAdjustment} disabled={adjustStockMutation.isPending}>
                {adjustStockMutation.isPending ? 'Сохранение...' : 'Применить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editSheet === "price"} onOpenChange={(open) => !open && setEditSheet(null)}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setEditSheet("price")}>
              <Edit2 className="mr-2 h-4 w-4" />
              Изменить цену
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изменить цену</DialogTitle>
              <DialogDescription>
                Текущая цена: {formatCurrency(item.price)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price">Новая цена (₸)</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="1500"
                />
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md space-y-1">
                <p>Себестоимость: {formatCurrency(totalCost)}</p>
                <p>Новая наценка: {priceValue ? calculateMarkup(totalCost, parseFloat(priceValue)) : '0'}%</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePriceUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Movement History */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>История движения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    movement.type === 'in' ? 'bg-green-100 text-green-600' :
                    movement.type === 'out' ? 'bg-red-100 text-red-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {movement.type === 'in' ? <TrendingUp className="h-4 w-4" /> :
                     movement.type === 'out' ? <TrendingDown className="h-4 w-4" /> :
                     <RefreshCw className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {movement.type === 'in' ? '+' : '-'}{movement.quantity} шт
                    </p>
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
                <div className="text-sm text-muted-foreground">
                  {format(movement.createdAt, "dd.MM.yyyy HH:mm")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WarehouseItemDetailPage