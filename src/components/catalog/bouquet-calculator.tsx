import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { warehouseApi } from "@/lib/api"
import type { ProductIngredientCreate, WarehouseItem } from "@/lib/types"

interface BouquetIngredient extends ProductIngredientCreate {
  warehouseItem?: WarehouseItem
}

interface BouquetCalculatorProps {
  ingredients: BouquetIngredient[]
  onChange: (ingredients: BouquetIngredient[]) => void
  onCostChange?: (cost: number) => void
}

export function BouquetCalculator({ ingredients, onChange, onCostChange }: BouquetCalculatorProps) {
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load warehouse items on component mount
  useEffect(() => {
    loadWarehouseItems()
  }, [])

  // Focus search input when section opens
  useEffect(() => {
    if (isAddSectionOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isAddSectionOpen])

  // Calculate total cost whenever ingredients change
  useEffect(() => {
    const totalCost = ingredients.reduce((sum, ing) => {
      const price = ing.warehouseItem?.priceKzt || 0
      return sum + (price * ing.quantity)
    }, 0)
    onCostChange?.(totalCost)
  }, [ingredients, onCostChange])

  const loadWarehouseItems = async () => {
    try {
      setLoading(true)
      const response = await warehouseApi.getItems({ 
        limit: 100
      })
      setWarehouseItems(response.items)
    } catch (err) {
      toast.error('Ошибка при загрузке товаров со склада')
      console.error('Error loading warehouse items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = () => {
    if (!selectedItem) {
      toast.error('Выберите товар со склада')
      return
    }

    // Check if item already exists
    const exists = ingredients.some(ing => ing.warehouseItemId === selectedItem.id)
    if (exists) {
      toast.error('Этот товар уже добавлен')
      return
    }

    const newIngredient: BouquetIngredient = {
      warehouseItemId: selectedItem.id,
      quantity,
      notes: notes || undefined,
      warehouseItem: selectedItem
    }

    onChange([...ingredients, newIngredient])
    
    // Reset form
    setSelectedItem(null)
    setQuantity(1)
    setNotes("")
    setSearchQuery("")
    setIsAddSectionOpen(false)
    toast.success('Ингредиент добавлен')
  }

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    const updated = [...ingredients]
    updated[index] = { ...updated[index], quantity: newQuantity }
    onChange(updated)
  }

  const handleRemoveIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index)
    onChange(updated)
    toast.success('Ингредиент удален')
  }

  const calculateTotalCost = () => {
    return ingredients.reduce((sum, ing) => {
      const price = ing.warehouseItem?.priceKzt || 0
      return sum + (price * ing.quantity)
    }, 0)
  }

  const filteredItems = warehouseItems.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.variety.toLowerCase().includes(query) ||
      item.supplier.toLowerCase().includes(query) ||
      item.farm.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Состав букета</Label>
      </div>

      {/* Ingredients list */}
      {ingredients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Состав букета не указан. Добавьте ингредиенты ниже.
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ing, index) => (
            <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex-1">
                <div className="font-medium">
                  {ing.warehouseItem?.variety} ({ing.warehouseItem?.heightCm} см)
                </div>
                <div className="text-sm text-muted-foreground">
                  {ing.warehouseItem?.supplier} / {ing.warehouseItem?.farm}
                </div>
                {ing.notes && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {ing.notes}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={ing.quantity}
                  onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">шт</span>
              </div>
              
              <div className="text-right">
                <div className="font-medium">
                  {((ing.warehouseItem?.priceKzt || 0) * ing.quantity).toLocaleString()} ₸
                </div>
                <div className="text-sm text-muted-foreground">
                  {ing.warehouseItem?.priceKzt?.toLocaleString() || 0} ₸/шт
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveIngredient(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Total */}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Итого себестоимость:</span>
            <span className="text-lg font-semibold">
              {calculateTotalCost().toLocaleString()} ₸
            </span>
          </div>
        </div>
      )}

      {/* Add ingredient section */}
      <Collapsible open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Добавить ингредиент
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isAddSectionOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Поиск по названию, поставщику или ферме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Items list */}
          <div className="border rounded-lg max-h-64 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Загрузка...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Товары не найдены
              </div>
            ) : (
              <div className="divide-y">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer p-3 transition-colors hover:bg-muted/50 ${
                      selectedItem?.id === item.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {item.variety} ({item.heightCm} см)
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.supplier} / {item.farm}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={item.availableQty > 10 ? "default" : "secondary"} className="whitespace-nowrap">
                          {item.availableQty} шт
                        </Badge>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {item.priceKzt?.toLocaleString() || 0} ₸
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected item details */}
          {selectedItem && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div>
                <div className="text-sm text-muted-foreground">Выбрано:</div>
                <div className="font-medium">
                  {selectedItem.variety} ({selectedItem.heightCm} см)
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedItem.supplier} / {selectedItem.farm}
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedItem.availableQty}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Примечание</Label>
                  <Input
                    id="notes"
                    placeholder="Опционально"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-sm text-muted-foreground">Стоимость:</div>
                  <div className="text-lg font-semibold">
                    {((selectedItem.priceKzt || 0) * quantity).toLocaleString()} ₸
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedItem(null)
                      setQuantity(1)
                      setNotes("")
                    }}
                  >
                    Сбросить
                  </Button>
                  <Button onClick={handleAddIngredient}>
                    Добавить в состав
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}