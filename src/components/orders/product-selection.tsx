import { useState } from "react"
import { Search, Plus, Minus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Product, OrderItem } from "@/lib/types"

interface ProductSelectionProps {
  orderItems: OrderItem[]
  onUpdateItems: (items: OrderItem[]) => void
}

// Mock products
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Букет из 25 красных роз",
    category: "bouquet",
    description: "Классический букет из красных роз высотой 60см",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop",
    costPrice: 7500,
    retailPrice: 15000,
    isActive: true,
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Композиция \"Весеннее настроение\"",
    category: "composition",
    description: "Яркая композиция с тюльпанами и ирисами",
    imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=300&h=300&fit=crop",
    costPrice: 5000,
    retailPrice: 12000,
    salePrice: 10000,
    isActive: true,
    isNew: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Орхидея в горшке",
    category: "potted",
    description: "Белая орхидея фаленопсис",
    imageUrl: "https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=300&h=300&fit=crop",
    costPrice: 8000,
    retailPrice: 18000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    name: "Букет из 51 тюльпана",
    category: "bouquet",
    description: "Нежный букет из разноцветных тюльпанов",
    imageUrl: "https://images.unsplash.com/photo-1554631221-f9603e6808be?w=300&h=300&fit=crop",
    costPrice: 6000,
    retailPrice: 13000,
    isActive: true,
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export function ProductSelection({ orderItems, onUpdateItems }: ProductSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    product.isActive
  )

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        product,
        quantity: 1,
        price: product.salePrice || product.retailPrice,
        total: product.salePrice || product.retailPrice
      }
      onUpdateItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }

    const updatedItems = orderItems.map(item => {
      if (item.productId === productId) {
        const price = item.product?.salePrice || item.product?.retailPrice || item.price
        return {
          ...item,
          quantity,
          total: price * quantity
        }
      }
      return item
    })
    onUpdateItems(updatedItems)
  }

  const removeProduct = (productId: string) => {
    onUpdateItems(orderItems.filter(item => item.productId !== productId))
  }

  const getCategoryLabel = (category: Product['category']) => {
    const labels = {
      bouquet: 'Букет',
      composition: 'Композиция',
      potted: 'Горшечное',
      other: 'Другое'
    }
    return labels[category]
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Product list */}
        <div>
          <h3 className="font-medium mb-3">Доступные товары</h3>
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addProduct(product)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getCategoryLabel(product.category)}
                            </p>
                          </div>
                          <div className="text-right">
                            {product.salePrice ? (
                              <>
                                <p className="text-sm font-medium text-destructive">
                                  {product.salePrice.toLocaleString()} ₸
                                </p>
                                <p className="text-xs text-muted-foreground line-through">
                                  {product.retailPrice.toLocaleString()} ₸
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-medium">
                                {product.retailPrice.toLocaleString()} ₸
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {product.isPopular && (
                            <Badge variant="secondary" className="text-xs">Популярный</Badge>
                          )}
                          {product.isNew && (
                            <Badge variant="info" className="text-xs">Новинка</Badge>
                          )}
                          {product.salePrice && (
                            <Badge variant="destructive" className="text-xs">Акция</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Selected items */}
        <div>
          <h3 className="font-medium mb-3">Товары в заказе</h3>
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-3">
              {orderItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Нет выбранных товаров
                </p>
              ) : (
                orderItems.map((item) => (
                  <Card key={item.productId}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.price.toLocaleString()} ₸ × {item.quantity} = {item.total.toLocaleString()} ₸
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.productId, item.quantity - 1)
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.productId, item.quantity + 1)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeProduct(item.productId)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {orderItems.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <div className="flex justify-between items-center">
                <span className="font-medium">Итого:</span>
                <span className="text-xl font-bold">
                  {orderItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()} ₸
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}