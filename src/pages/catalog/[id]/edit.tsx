import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhotoUpload } from "@/components/catalog/photo-upload"
import { BouquetCalculator } from "@/components/catalog/bouquet-calculator"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productsApi, productIngredientsApi } from "@/lib/api"
import type { Product, ProductIngredientWithDetails } from "@/lib/types"

const productSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  category: z.enum(["bouquet", "composition", "potted", "other"]),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Себестоимость не может быть отрицательной"),
  retailPrice: z.number().min(0, "Розничная цена не может быть отрицательной"),
  salePrice: z.number().optional(),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  isNew: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

export function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: "bouquet",
      isActive: true,
      isPopular: false,
      isNew: false,
      costPrice: 0,
      retailPrice: 0
    }
  })

  useEffect(() => {
    const loadProductData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        
        // Load product and ingredients
        const [productData, ingredientsData] = await Promise.all([
          productsApi.getById(parseInt(id)),
          productIngredientsApi.getAll(parseInt(id))
        ])
        
        setProduct(productData)
        
        // Set form data
        reset({
          name: productData.name,
          category: productData.category,
          description: productData.description || "",
          costPrice: productData.costPrice,
          retailPrice: productData.retailPrice,
          salePrice: productData.salePrice,
          isActive: productData.isActive,
          isPopular: productData.isPopular,
          isNew: productData.isNew
        })
        
        // Set photos
        if (productData.images) {
          setPhotos(productData.images.map(img => img.imageUrl))
        }
        
        // Transform ingredients for the calculator
        const transformedIngredients = ingredientsData.map(ing => ({
          warehouseItemId: ing.warehouseItemId,
          quantity: ing.quantity,
          notes: ing.notes,
          warehouseItem: {
            id: ing.warehouseItemId,
            variety: ing.variety,
            heightCm: ing.heightCm,
            supplier: ing.supplier,
            farm: ing.farm,
            availableQty: ing.availableQty,
            priceKzt: ing.priceKzt || ing.price || 0
          }
        }))
        setIngredients(transformedIngredients)
      } catch (err) {
        toast.error('Ошибка при загрузке товара')
        console.error('Error loading product:', err)
        navigate('/catalog')
      } finally {
        setLoading(false)
      }
    }

    loadProductData()
  }, [id, reset, navigate])

  // Update cost price when ingredients change
  useEffect(() => {
    if (watch("category") === "bouquet" && calculatedCost > 0) {
      setValue("costPrice", calculatedCost)
    }
  }, [calculatedCost, setValue, watch])

  const watchRetailPrice = watch("retailPrice")
  const watchSalePrice = watch("salePrice")
  const watchCostPrice = watch("costPrice")

  const calculateMarkup = () => {
    if (watchCostPrice > 0) {
      const price = watchSalePrice || watchRetailPrice
      return Math.round(((price - watchCostPrice) / watchCostPrice) * 100)
    }
    return 0
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return
    
    if (photos.length === 0) {
      toast.error("Добавьте хотя бы одну фотографию товара")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Update product
      await productsApi.update(product.id, data)
      
      // Update images if changed
      if (photos.join(',') !== product.images?.map(img => img.imageUrl).join(',')) {
        await productsApi.updateImages(product.id, photos)
      }
      
      // Update ingredients
      // First, get current ingredients
      const currentIngredients = await productIngredientsApi.getAll(product.id)
      
      // Remove ingredients that are no longer in the list
      for (const current of currentIngredients) {
        const stillExists = ingredients.some(ing => ing.warehouseItemId === current.warehouseItemId)
        if (!stillExists) {
          await productIngredientsApi.delete(product.id, current.id)
        }
      }
      
      // Add new ingredients or update existing ones
      for (const ing of ingredients) {
        const existing = currentIngredients.find(c => c.warehouseItemId === ing.warehouseItemId)
        if (existing) {
          // Update if quantity or notes changed
          if (existing.quantity !== ing.quantity || existing.notes !== ing.notes) {
            await productIngredientsApi.update(product.id, existing.id, {
              quantity: ing.quantity,
              notes: ing.notes
            })
          }
        } else {
          // Add new ingredient
          await productIngredientsApi.add(product.id, {
            warehouseItemId: ing.warehouseItemId,
            quantity: ing.quantity,
            notes: ing.notes
          })
        }
      }
      
      toast.success("Товар успешно обновлен")
      navigate(`/catalog/${product.id}`)
    } catch (err) {
      toast.error('Ошибка при обновлении товара')
      console.error('Error updating product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка товара...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Товар не найден</p>
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
          onClick={() => navigate(`/catalog/${product.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Редактировать товар
          </h1>
          <p className="text-sm text-muted-foreground">
            Внесите изменения в информацию о товаре
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
            <CardDescription>
              Первая фотография будет использоваться как главная
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload value={photos} onChange={setPhotos} />
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название товара</Label>
              <Input
                id="name"
                placeholder="Например: Букет из 25 красных роз"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value as any)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bouquet">Букет</SelectItem>
                  <SelectItem value="composition">Композиция</SelectItem>
                  <SelectItem value="potted">Горшечное</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Краткое описание товара"
                rows={3}
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouquet composition for bouquet category */}
        {watch("category") === "bouquet" && (
          <Card>
            <CardHeader>
              <CardTitle>Состав букета</CardTitle>
              <CardDescription>
                Укажите цветы и их количество для расчета себестоимости
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BouquetCalculator
                ingredients={ingredients}
                onChange={setIngredients}
                onCostChange={setCalculatedCost}
              />
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Цены</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Себестоимость</Label>
                <Input
                  id="costPrice"
                  type="number"
                  placeholder="0"
                  {...register("costPrice", { valueAsNumber: true })}
                  disabled={watch("category") === "bouquet" && calculatedCost > 0}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retailPrice">Розничная цена</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  placeholder="0"
                  {...register("retailPrice", { valueAsNumber: true })}
                />
                {errors.retailPrice && (
                  <p className="text-sm text-destructive">{errors.retailPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Цена со скидкой</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="Оставьте пустым, если нет скидки"
                  {...register("salePrice", { 
                    valueAsNumber: true,
                    setValueAs: v => v === "" ? undefined : Number(v)
                  })}
                />
              </div>
            </div>

            {watchCostPrice > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Наценка</span>
                  <span className="text-lg font-semibold">{calculateMarkup()}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Статус и признаки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Активен</Label>
                <p className="text-sm text-muted-foreground">
                  Товар будет отображаться в каталоге
                </p>
              </div>
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPopular">Популярный</Label>
                <p className="text-sm text-muted-foreground">
                  Отметить товар как популярный
                </p>
              </div>
              <Switch
                id="isPopular"
                checked={watch("isPopular")}
                onCheckedChange={(checked) => setValue("isPopular", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isNew">Новинка</Label>
                <p className="text-sm text-muted-foreground">
                  Отметить товар как новинку
                </p>
              </div>
              <Switch
                id="isNew"
                checked={watch("isNew")}
                onCheckedChange={(checked) => setValue("isNew", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/catalog/${product.id}`)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>
    </div>
  )
}