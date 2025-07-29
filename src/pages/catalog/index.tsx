import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Grid3x3, List, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageFilters } from "@/components/ui/page-filters"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

      {/* Filters */}
      <PageFilters
        config={{
          searchPlaceholder: "Поиск по названию...",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          selectFilters: [
            {
              value: sortBy,
              onChange: setSortBy,
              placeholder: "Сортировка",
              options: [
                { value: "name", label: "По названию" },
                { value: "price_asc", label: "Цена: по возрастанию" },
                { value: "price_desc", label: "Цена: по убыванию" },
                { value: "date", label: "По дате добавления" }
              ]
            }
          ],
          advancedFilters: {
            trigger: "Фильтры",
            content: (
              <>
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
              </>
            )
          },
          viewModes: [
            {
              value: "grid",
              icon: <Grid3x3 className="h-4 w-4" />,
              active: viewMode === "grid",
              onClick: () => setViewMode("grid")
            },
            {
              value: "list",
              icon: <List className="h-4 w-4" />,
              active: viewMode === "list",
              onClick: () => setViewMode("list")
            }
          ]
        }}
      />

      {/* Products grid/list */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка товаров...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Повторить попытку
          </Button>
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
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
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
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