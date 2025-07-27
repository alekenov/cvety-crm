import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, Grid3x3, List, Loader2 } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ProductCard } from "@/components/catalog/product-card"
import { toast } from "sonner"
import { productsApi } from "@/lib/api"
import type { Product } from "@/lib/types"

export function CatalogPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 50000],
    showInactive: false,
    showPopular: false,
    showNew: false,
    showOnSale: false
  })

  // Fetch products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await productsApi.getAll()
        setProducts(response.items)
      } catch (err) {
        setError('Ошибка при загрузке товаров')
        console.error('Error loading products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleEdit = (product: Product) => {
    navigate(`/catalog/${product.id}/edit`)
  }

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      return
    }

    try {
      await productsApi.delete(product.id)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success(`Товар "${product.name}" удален`)
    } catch (err) {
      toast.error('Ошибка при удалении товара')
      console.error('Error deleting product:', err)
    }
  }

  const handleView = (product: Product) => {
    navigate(`/catalog/${product.id}`)
  }

  // Filter products
  let filteredProducts = products.filter(product => {
    // Search
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Categories
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false
    }

    // Price range
    const price = product.currentPrice
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
      return false
    }

    // Status filters
    if (!filters.showInactive && !product.isActive) return false
    if (filters.showPopular && !product.isPopular) return false
    if (filters.showNew && !product.isNew) return false
    if (filters.showOnSale && !product.salePrice) return false

    return true
  })

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "price_asc":
        return a.currentPrice - b.currentPrice
      case "price_desc":
        return b.currentPrice - a.currentPrice
      case "date":
        return b.createdAt.getTime() - a.createdAt.getTime()
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Каталог товаров</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего товаров: {filteredProducts.length} из {products.length}
          </p>
        </div>
        <Button onClick={() => navigate("/catalog/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">По названию</SelectItem>
            <SelectItem value="price_asc">Цена: по возрастанию</SelectItem>
            <SelectItem value="price_desc">Цена: по убыванию</SelectItem>
            <SelectItem value="date">По дате добавления</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Фильтры
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Категории</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { value: "bouquet", label: "Букеты" },
              { value: "composition", label: "Композиции" },
              { value: "potted", label: "Горшечные" },
              { value: "other", label: "Другое" }
            ].map(category => (
              <DropdownMenuCheckboxItem
                key={category.value}
                checked={filters.categories.includes(category.value)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    categories: checked
                      ? [...prev.categories, category.value]
                      : prev.categories.filter(c => c !== category.value)
                  }))
                }}
              >
                {category.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Цена</DropdownMenuLabel>
            <div className="px-2 py-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>{filters.priceRange[0].toLocaleString()} ₸</span>
                <span>{filters.priceRange[1].toLocaleString()} ₸</span>
              </div>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                min={0}
                max={50000}
                step={1000}
                className="mb-2"
              />
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Статус</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.showInactive}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showInactive: checked }))
              }
            >
              Показать неактивные
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.showPopular}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showPopular: checked }))
              }
            >
              Только популярные
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.showNew}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showNew: checked }))
              }
            >
              Только новинки
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.showOnSale}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showOnSale: checked }))
              }
            >
              Только со скидкой
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products grid/list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка товаров...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Повторить попытку
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Товары не найдены</p>
          <Button 
            variant="link" 
            onClick={() => {
              setSearchQuery("")
              setFilters({
                categories: [],
                priceRange: [0, 50000],
                showInactive: false,
                showPopular: false,
                showNew: false,
                showOnSale: false
              })
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              className={viewMode === "list" ? "flex-row" : ""}
            />
          ))}
        </div>
      )}
    </div>
  )
}