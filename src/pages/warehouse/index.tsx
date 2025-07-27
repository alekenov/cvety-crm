import { useState } from "react"
import { toast } from "sonner"
import { Package, Store, AlertTriangle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { WarehouseItem } from "@/lib/types"
import { VARIETIES, FARMS, SUPPLIERS, HEIGHTS } from "@/lib/constants"

// Mock data
const mockWarehouseItems: WarehouseItem[] = [
  {
    id: "1",
    sku: "ROS-RED-60",
    batchCode: "B2024-001",
    variety: "Роза",
    heightCm: 60,
    farm: "Эквадор Розы",
    supplier: "ООО \"ЦветОпт\"",
    deliveryDate: new Date("2024-01-20"),
    currency: "USD",
    rate: 450,
    cost: 0.5,
    recommendedPrice: 450,
    price: 500,
    markupPct: 100,
    qty: 12,
    reservedQty: 5,
    onShowcase: true,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date("2024-01-26"),
    updatedBy: "admin"
  },
  {
    id: "2",
    sku: "TUL-WHT-50",
    batchCode: "B2024-002",
    variety: "Тюльпан",
    heightCm: 50,
    farm: "Голландия Флауэрс",
    supplier: "Flower Direct",
    deliveryDate: new Date("2024-01-22"),
    currency: "EUR",
    rate: 490,
    cost: 0.3,
    recommendedPrice: 300,
    price: 350,
    markupPct: 115,
    qty: 25,
    reservedQty: 0,
    onShowcase: false,
    toWriteOff: false,
    hidden: false,
    updatedAt: new Date("2024-01-26"),
    updatedBy: "manager"
  },
  {
    id: "3",
    sku: "CHR-PNK-70",
    batchCode: "B2024-003",
    variety: "Хризантема",
    heightCm: 70,
    farm: "Местная ферма",
    supplier: "Местный поставщик",
    deliveryDate: new Date("2024-01-15"),
    currency: "KZT",
    rate: 1,
    cost: 150,
    recommendedPrice: 300,
    price: 320,
    markupPct: 100,
    qty: 30,
    reservedQty: 10,
    onShowcase: true,
    toWriteOff: true,
    hidden: false,
    updatedAt: new Date("2024-01-26"),
    updatedBy: "admin"
  }
]

export function WarehousePage() {
  const [items] = useState<WarehouseItem[]>(mockWarehouseItems)
  const [varietyFilter, setVarietyFilter] = useState<string>("all")
  const [heightFilter, setHeightFilter] = useState<string>("all")
  const [farmFilter, setFarmFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [flagFilter, setFlagFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null)
  const [editPrice, setEditPrice] = useState("")
  const [editOnShowcase, setEditOnShowcase] = useState(false)
  const [editToWriteOff, setEditToWriteOff] = useState(false)
  const [editHidden, setEditHidden] = useState(false)

  const handleQuickEdit = (item: WarehouseItem) => {
    setEditingItem(item)
    setEditPrice(item.price.toString())
    setEditOnShowcase(item.onShowcase)
    setEditToWriteOff(item.toWriteOff)
    setEditHidden(item.hidden)
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      toast.success(`Позиция ${editingItem.sku} обновлена`)
      setEditingItem(null)
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

  const getStockStatusColor = (qty: number): string => {
    if (qty <= 15) return "text-destructive"
    if (qty <= 30) return "text-orange-500"
    return ""
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Остатки склада</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={varietyFilter} onValueChange={setVarietyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все сорта" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сорта</SelectItem>
            {VARIETIES.map((variety) => (
              <SelectItem key={variety} value={variety}>
                {variety}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={heightFilter} onValueChange={setHeightFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Вся высота" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Вся высота</SelectItem>
            {HEIGHTS.map((height) => (
              <SelectItem key={height} value={height.toString()}>
                {height} см
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={farmFilter} onValueChange={setFarmFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все фермы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все фермы</SelectItem>
            {FARMS.map((farm) => (
              <SelectItem key={farm} value={farm}>
                {farm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все поставщики" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все поставщики</SelectItem>
            {SUPPLIERS.map((supplier) => (
              <SelectItem key={supplier} value={supplier}>
                {supplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={flagFilter} onValueChange={setFlagFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все флаги" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все флаги</SelectItem>
            <SelectItem value="showcase">На витрине</SelectItem>
            <SelectItem value="writeoff">К списанию</SelectItem>
            <SelectItem value="hidden">Скрытые</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Поиск по SKU или партии"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Номенклатура</TableHead>
              <TableHead>Поставка</TableHead>
              <TableHead>Экономика</TableHead>
              <TableHead>Остатки</TableHead>
              <TableHead>Флаги</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{item.sku}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.batchCode}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{item.variety} {item.heightCm}см</div>
                    <div className="text-xs text-muted-foreground">
                      {item.farm}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(item.deliveryDate).toLocaleDateString('ru-KZ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.supplier}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${getStockStatusColor(item.qty)}`}>
                            {item.qty} шт
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
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickEdit(item)}
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
                        <Button onClick={handleSaveEdit}>Сохранить</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}