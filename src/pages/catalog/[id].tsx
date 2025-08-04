import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Edit, Trash2, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { productsApi, productIngredientsApi } from "@/lib/api"
import type { ProductWithStats, ProductIngredientWithDetails } from "@/lib/types"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductWithStats | null>(null)
  const [ingredients, setIngredients] = useState<ProductIngredientWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProductData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load product and ingredients in parallel
        const [productData, ingredientsData] = await Promise.all([
          productsApi.getById(parseInt(id)),
          productIngredientsApi.getAll(parseInt(id))
        ])
        
        setProduct(productData)
        setIngredients(ingredientsData)
      } catch (err) {
        setError('Ошибка при загрузке товара')
        console.error('Error loading product:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProductData()
  }, [id])

  const handleDelete = async () => {
    if (!product || !window.confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      return
    }

    try {
      await productsApi.delete(product.id)
      toast.success(`Товар "${product.name}" удален`)
      navigate("/catalog")
    } catch (err) {
      toast.error('Ошибка при удалении товара')
      console.error('Error deleting product:', err)
    }
  }

  const calculateTotalCost = () => {
    return ingredients.reduce((total, ing) => total + (ing.price * ing.quantity), 0)
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bouquet: "Букет",
      composition: "Композиция",
      potted: "Горшечное",
      other: "Другое"
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка товара...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Товар не найден"}</p>
        <Button onClick={() => navigate("/catalog")}>
          Вернуться к каталогу
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/catalog")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{getCategoryLabel(product.category)}</Badge>
            {product.isPopular && <Badge>Популярный</Badge>}
            {product.isNew && <Badge variant="outline">Новинка</Badge>}
            {!product.isActive && <Badge variant="destructive">Неактивен</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/catalog/${product.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {product.images && product.images.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-6">
                  {product.images.map((image, index) => (
                    <div key={image.id} className="relative aspect-square">
                      <img
                        src={image.imageUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {image.isPrimary && (
                        <Badge className="absolute top-2 left-2">Главная</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Package className="inline-block mr-2 h-5 w-5" />
                Состав букета
              </CardTitle>
              <CardDescription>
                {ingredients.length > 0 
                  ? `${ingredients.length} позиций`
                  : "Состав не указан"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ingredients.length > 0 ? (
                <div className="space-y-4">
                  {ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {ing.variety} ({ing.heightCm} см)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ing.supplier} / {ing.farm}
                        </div>
                        {ing.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {ing.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{ing.quantity} шт</div>
                        <div className="text-sm text-muted-foreground">
                          {ing.price.toLocaleString()} ₸ / шт
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Итого себестоимость:</span>
                    <span className="text-lg">{calculateTotalCost().toLocaleString()} ₸</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Состав букета не указан. Добавьте ингредиенты при редактировании товара.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with prices and stats */}
        <div className="space-y-6">
          {/* Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Цены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Себестоимость</div>
                <div className="text-xl font-semibold">
                  {product.costPrice.toLocaleString()} ₸
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Розничная цена</div>
                <div className="text-xl font-semibold">
                  {product.retailPrice.toLocaleString()} ₸
                </div>
              </div>
              
              {product.salePrice && (
                <div>
                  <div className="text-sm text-muted-foreground">Цена со скидкой</div>
                  <div className="text-xl font-semibold text-destructive">
                    {product.salePrice.toLocaleString()} ₸
                    <Badge variant="destructive" className="ml-2">
                      -{product.discountPercentage}%
                    </Badge>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <div className="text-sm text-muted-foreground">Наценка</div>
                <div className="text-xl font-semibold">
                  {Math.round(((product.currentPrice - product.costPrice) / product.costPrice) * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Всего заказов</div>
                <div className="text-xl font-semibold">{product.totalOrders}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Общая выручка</div>
                <div className="text-xl font-semibold">
                  {product.totalRevenue.toLocaleString()} ₸
                </div>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <div>Создан: {new Date(product.createdAt).toLocaleDateString()}</div>
                <div>Обновлен: {new Date(product.updatedAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}