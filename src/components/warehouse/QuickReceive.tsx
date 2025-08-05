import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { Plus, ChevronDown, X, Package } from 'lucide-react'
import { warehouseApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface QuickReceiveItem {
  id: string
  name: string
  height: number
  quantity: number
  price: number
}

export function QuickReceive() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<QuickReceiveItem[]>([
    { id: '1', name: '', height: 60, quantity: 0, price: 0 }
  ])
  const [searchOpen, setSearchOpen] = useState<Record<string, boolean>>({})

  // Получаем список существующих товаров для автодополнения
  const { data: existingItems } = useQuery({
    queryKey: ['warehouse-autocomplete'],
    queryFn: async () => {
      const response = await warehouseApi.getItems({ limit: 100 })
      return response.items
    }
  })

  // Группируем товары по названию и высоте для автодополнения
  const autocompleteOptions = existingItems?.reduce((acc, item) => {
    const key = `${item.variety} ${item.heightCm}см`
    if (!acc[key]) {
      acc[key] = {
        name: item.variety,
        height: item.heightCm,
        lastPrice: item.price
      }
    }
    return acc
  }, {} as Record<string, { name: string; height: number; lastPrice: number }>)

  // Мутация для быстрого добавления
  const quickAddMutation = useMutation({
    mutationFn: async (items: QuickReceiveItem[]) => {
      // Создаем поставку с минимальными данными
      const supplyData = {
        supplier: 'Быстрая приемка', // TODO: брать из настроек
        deliveryDate: new Date().toISOString(),
        currency: 'KZT',
        rate: 1,
        comment: 'Быстрая приемка товара',
        items: items.map(item => ({
          flowerName: item.name,
          heightCm: item.height,
          purchasePrice: item.price,
          quantity: item.quantity,
          categoryId: 1 // TODO: брать категорию "Розы" из настроек
        }))
      }
      
      return warehouseApi.createSupply(supplyData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      toast.success('Товары успешно добавлены')
      // Сбрасываем форму
      setItems([{ id: '1', name: '', height: 60, quantity: 0, price: 0 }])
    },
    onError: (error) => {
      toast.error('Ошибка при добавлении товаров')
      console.error(error)
    }
  })

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: '',
      height: 60,
      quantity: 0,
      price: 0
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuickReceiveItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const selectAutocomplete = (itemId: string, key: string) => {
    const option = autocompleteOptions?.[key]
    if (option) {
      // Обновляем весь объект за один раз
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, name: option.name, height: option.height, price: option.lastPrice }
            : item
        )
      )
      // Закрываем popover после выбора
      setSearchOpen({ ...searchOpen, [itemId]: false })
    }
  }

  const handleSubmit = () => {
    const validItems = items.filter(item => 
      item.name && item.quantity > 0 && item.price > 0
    )
    
    if (validItems.length === 0) {
      toast.error('Заполните хотя бы одну позицию')
      return
    }

    quickAddMutation.mutate(validItems)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6 max-w-4xl">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle className="text-lg">Быстрая приемка</CardTitle>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
            {!isOpen && (
              <CardDescription>
                Добавить несколько позиций на склад
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Заголовки колонок */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Название и высота</div>
              <div className="col-span-2">Кол-во</div>
              <div className="col-span-2">Цена</div>
              <div className="col-span-3"></div>
            </div>

            {/* Строки ввода */}
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Popover open={searchOpen[item.id]} onOpenChange={(open) => 
                    setSearchOpen({ ...searchOpen, [item.id]: open })
                  }>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={searchOpen[item.id]}
                        className="w-full justify-between text-left font-normal"
                      >
                        {item.name ? 
                          `${item.name} ${item.height}см` : 
                          "Выберите товар..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск товара..." />
                        <CommandEmpty>Товар не найден</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {Object.entries(autocompleteOptions || {}).map(([key, option]) => (
                            <CommandItem
                              key={key}
                              value={key}
                              onSelect={() => selectAutocomplete(item.id, key)}
                            >
                              <div className="flex justify-between w-full">
                                <span>{key}</span>
                                <span className="text-muted-foreground">
                                  {option.lastPrice} ₸
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    className="max-w-[100px]"
                  />
                </div>
                
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.price || ''}
                    onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                    min="1"
                    className="max-w-[120px]"
                  />
                </div>
                
                <div className="col-span-3 flex gap-1">
                  {index === items.length - 1 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addItem}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Кнопки действий */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={addItem}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить еще позицию
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={quickAddMutation.isPending}
              >
                {quickAddMutation.isPending ? 'Добавление...' : 'Добавить на склад'}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}