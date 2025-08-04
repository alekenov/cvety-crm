import { useState, useEffect } from "react"
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Package,
  DollarSign,
  TrendingUp,
  Search,
  Info,
  Settings
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { BouquetItem, WarehouseItem } from "@/lib/types"
import { calculatorApi, warehouseApi } from "@/lib/api"

// Mock warehouse items for selection
const mockWarehouseItems: WarehouseItem[] = [
  {
    id: "1",
    sku: "ROSE-RED-60",
    batchCode: "B001",
    variety: "Роза Ред Наоми",
    heightCm: 60,
    farm: "Tambuzi",
    supplier: "GreenWorld",
    deliveryDate: new Date("2024-01-20"),
    currency: "USD",
    rate: 450,
    cost: 0.8,
    recommendedPrice: 500,
    price: 500,
    markupPct: 38.9,
    qty: 250,
    reservedQty: 50,
    onShowcase: true,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date(),
    updatedBy: "admin"
  },
  {
    id: "2",
    sku: "ROSE-WHITE-50",
    batchCode: "B002",
    variety: "Роза Аваланч",
    heightCm: 50,
    farm: "Tambuzi",
    supplier: "GreenWorld",
    deliveryDate: new Date("2024-01-20"),
    currency: "USD",
    rate: 450,
    cost: 0.7,
    recommendedPrice: 450,
    price: 450,
    markupPct: 42.9,
    qty: 180,
    reservedQty: 30,
    onShowcase: true,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date(),
    updatedBy: "admin"
  },
  {
    id: "3",
    sku: "TUL-PINK-40",
    batchCode: "B003",
    variety: "Тюльпан Пинк",
    heightCm: 40,
    farm: "Holland Flowers",
    supplier: "FlowerExpress",
    deliveryDate: new Date("2024-01-22"),
    currency: "EUR",
    rate: 490,
    cost: 0.5,
    recommendedPrice: 350,
    price: 350,
    markupPct: 42.9,
    qty: 300,
    reservedQty: 0,
    onShowcase: true,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date(),
    updatedBy: "admin"
  },
  {
    id: "4",
    sku: "EUS-WHITE-50",
    batchCode: "B004",
    variety: "Эустома белая",
    heightCm: 50,
    farm: "Kenya Flowers",
    supplier: "GreenWorld",
    deliveryDate: new Date("2024-01-21"),
    currency: "USD",
    rate: 450,
    cost: 1.2,
    recommendedPrice: 700,
    price: 700,
    markupPct: 29.2,
    qty: 100,
    reservedQty: 20,
    onShowcase: true,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date(),
    updatedBy: "admin"
  }
]

// Decorative materials will be loaded from API

export function BouquetCalculatorPage() {
  const [selectedItems, setSelectedItems] = useState<BouquetItem[]>([])
  const [decorItems, setDecorItems] = useState<{ name: string; price: number; qty: number }[]>([])
  const [laborCost, setLaborCost] = useState(2000)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<WarehouseItem | null>(null)
  const [itemQty, setItemQty] = useState(1)
  const [decorMaterials, setDecorMaterials] = useState<{ id: number; name: string; price: number; category?: string }[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false)
  
  // Load decorative materials and settings from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMaterials(true)
        
        // Load decorative materials
        const materialsResponse = await calculatorApi.getMaterials()
        if (materialsResponse.items) {
          setDecorMaterials(materialsResponse.items.filter((m: any) => m.is_active))
        }
        
        // Load calculator settings
        const settingsResponse = await calculatorApi.getSettings()
        if (settingsResponse.default_labor_cost) {
          setLaborCost(Number(settingsResponse.default_labor_cost))
        }
      } catch (error) {
        console.error('Failed to load calculator data:', error)
        // Use fallback data if API fails
        setDecorMaterials([
          { id: 1, name: "Упаковка крафт", price: 500 },
          { id: 2, name: "Упаковка корейская", price: 800 },
          { id: 3, name: "Лента атласная", price: 300 },
          { id: 4, name: "Лента бархатная", price: 500 },
          { id: 5, name: "Открытка", price: 200 },
          { id: 6, name: "Топпер", price: 1000 }
        ])
      } finally {
        setIsLoadingMaterials(false)
      }
    }
    
    loadData()
  }, [])
  
  // Load warehouse items when dialog opens
  useEffect(() => {
    if (showAddDialog && warehouseItems.length === 0) {
      loadWarehouseItems()
    }
  }, [showAddDialog])
  
  const loadWarehouseItems = async () => {
    try {
      setIsLoadingWarehouse(true)
      const response = await warehouseApi.getAll({ onShowcase: true, limit: 100 })
      if (response.items) {
        setWarehouseItems(response.items)
      }
    } catch (error) {
      console.error('Failed to load warehouse items:', error)
      // Use mock data as fallback
      setWarehouseItems(mockWarehouseItems)
    } finally {
      setIsLoadingWarehouse(false)
    }
  }

  const filteredWarehouseItems = warehouseItems.filter(item =>
    item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddItem = () => {
    if (!selectedWarehouseItem) {
      toast.error("Выберите товар")
      return
    }

    const existingIndex = selectedItems.findIndex(
      item => item.warehouseItemId === selectedWarehouseItem.id
    )

    if (existingIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...selectedItems]
      updatedItems[existingIndex].qty += itemQty
      setSelectedItems(updatedItems)
    } else {
      // Add new item
      const newItem: BouquetItem = {
        warehouseItemId: selectedWarehouseItem.id,
        sku: selectedWarehouseItem.sku,
        variety: selectedWarehouseItem.variety,
        heightCm: selectedWarehouseItem.heightCm,
        qty: itemQty,
        price: selectedWarehouseItem.price,
        cost: selectedWarehouseItem.cost * selectedWarehouseItem.rate
      }
      setSelectedItems([...selectedItems, newItem])
    }

    toast.success("Товар добавлен")
    setShowAddDialog(false)
    setSelectedWarehouseItem(null)
    setItemQty(1)
    setSearchQuery("")
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (qty <= 0) return
    const updatedItems = [...selectedItems]
    updatedItems[index].qty = qty
    setSelectedItems(updatedItems)
  }

  const handleAddDecor = (material: { id?: number; name: string; price: number }) => {
    const existingIndex = decorItems.findIndex(item => item.name === material.name)
    
    if (existingIndex >= 0) {
      const updatedItems = [...decorItems]
      updatedItems[existingIndex].qty += 1
      setDecorItems(updatedItems)
    } else {
      setDecorItems([...decorItems, { ...material, qty: 1 }])
    }
  }

  const handleRemoveDecor = (index: number) => {
    setDecorItems(decorItems.filter((_, i) => i !== index))
  }

  const calculateTotalCost = () => {
    const flowersCost = selectedItems.reduce((sum, item) => sum + (item.cost * item.qty), 0)
    const decorCost = decorItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    return flowersCost + decorCost + laborCost
  }

  const calculateTotalPrice = () => {
    const flowersPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const decorPrice = decorItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    return flowersPrice + decorPrice + laborCost
  }

  const calculateMargin = () => {
    const cost = calculateTotalCost()
    const price = calculateTotalPrice()
    return price - cost
  }

  const calculateMarginPercent = () => {
    const cost = calculateTotalCost()
    const margin = calculateMargin()
    return cost > 0 ? (margin / cost) * 100 : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Калькулятор букета</h1>
          <p className="text-muted-foreground">
            Расчет стоимости и маржинальности букета
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/settings/calculator'}>
            <Settings className="mr-2 h-4 w-4" />
            Настройки
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить цветы
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flowers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Состав букета</CardTitle>
              <CardDescription>
                Добавьте цветы и зелень для расчета стоимости
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-2" />
                  <p>Добавьте цветы для начала расчета</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>Кол-во</TableHead>
                      <TableHead>Цена/шт</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.variety}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.heightCm}см • {item.sku}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItemQty(index, parseInt(e.target.value))}
                            className="w-20"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.price * item.qty)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Decoration & Labor */}
          <Card>
            <CardHeader>
              <CardTitle>Оформление и работа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Декоративные материалы</Label>
                {isLoadingMaterials ? (
                  <div className="text-sm text-muted-foreground mt-2">Загрузка материалов...</div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {decorMaterials.map((material) => (
                      <Button
                        key={material.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddDecor(material)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {material.name} ({formatCurrency(material.price)})
                      </Button>
                    ))}
                  </div>
                )}
                
                {decorItems.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {decorItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">
                          {item.name} x{item.qty}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(item.price * item.qty)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveDecor(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label htmlFor="labor">Стоимость работы</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="labor"
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">тенге</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Итоговый расчет</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Себестоимость цветов:</span>
                  <span>{formatCurrency(
                    selectedItems.reduce((sum, item) => sum + (item.cost * item.qty), 0)
                  )}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Декор и упаковка:</span>
                  <span>{formatCurrency(
                    decorItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
                  )}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Работа:</span>
                  <span>{formatCurrency(laborCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Себестоимость:</span>
                  <span>{formatCurrency(calculateTotalCost())}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Цена продажи:</span>
                  <span>{formatCurrency(calculateTotalPrice())}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Маржа:</span>
                  <span className="text-green-600">
                    {formatCurrency(calculateMargin())}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Наценка:</span>
                  <span>{calculateMarginPercent().toFixed(1)}%</span>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Info className="mr-2 h-4 w-4" />
                    Рекомендации по ценообразованию
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Рекомендации</h4>
                    <p className="text-sm text-muted-foreground">
                      • Минимальная наценка: 30%<br />
                      • Рекомендуемая наценка: 50-70%<br />
                      • Премиум букеты: 100%+
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Текущая наценка: <span className="font-medium">{calculateMarginPercent().toFixed(1)}%</span>
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Сохранить как шаблон
              </Button>
              <Button className="w-full" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Создать заказ
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  setSelectedItems([])
                  setDecorItems([])
                  setLaborCost(2000)
                }}
              >
                Очистить
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить цветы</DialogTitle>
            <DialogDescription>
              Выберите товар со склада для добавления в букет
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или артикулу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {isLoadingWarehouse ? (
                <div className="text-center py-8 text-muted-foreground">
                  Загрузка товаров со склада...
                </div>
              ) : (
              <div className="space-y-2">
                {filteredWarehouseItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedWarehouseItem?.id === item.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedWarehouseItem(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.variety}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.heightCm}см • {item.sku} • Остаток: {item.qty - item.reservedQty} шт
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          Себест: {formatCurrency(item.cost * item.rate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </ScrollArea>

            {selectedWarehouseItem && (
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="qty">Количество</Label>
                  <Input
                    id="qty"
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    min="1"
                    max={selectedWarehouseItem.qty - selectedWarehouseItem.reservedQty}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Сумма</p>
                  <p className="font-medium">
                    {formatCurrency(selectedWarehouseItem.price * itemQty)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedWarehouseItem}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}