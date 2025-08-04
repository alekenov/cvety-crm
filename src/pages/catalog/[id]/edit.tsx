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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhotoUpload } from "@/components/catalog/photo-upload"
import { BouquetCalculator } from "@/components/catalog/bouquet-calculator"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productsApi, productComponentsApi } from "@/lib/api"
import type { Product, ProductComponent } from "@/lib/types"

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
  const [components, setComponents] = useState<ProductComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: '',
    componentType: 'flower' as 'flower' | 'material' | 'service',
    quantity: 1,
    unit: 'шт',
    unitCost: 0,
    unitPrice: 0
  })

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
        
        // Load product and components
        const [productData, componentsData] = await Promise.all([
          productsApi.getById(parseInt(id)),
          productComponentsApi.getAll(parseInt(id))
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
        
        // Set components
        setComponents(componentsData)
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
      
      toast.success("Товар успешно обновлен")
      navigate(`/catalog/${product.id}`)
    } catch (err) {
      toast.error('Ошибка при обновлении товара')
      console.error('Error updating product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Component management functions
  const updateComponentQuantity = async (componentId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      const updatedComponent = await productComponentsApi.update(parseInt(id!), componentId, {
        quantity: newQuantity
      })
      
      setComponents(prev => prev.map(comp => 
        comp.id === componentId ? updatedComponent : comp
      ))
      
      toast.success("Количество обновлено")
    } catch (err) {
      toast.error("Ошибка при обновлении количества")
      console.error('Error updating component quantity:', err)
    }
  }

  const deleteComponent = async (componentId: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот компонент?")) {
      return
    }
    
    try {
      await productComponentsApi.delete(parseInt(id!), componentId)
      
      setComponents(prev => prev.filter(comp => comp.id !== componentId))
      
      toast.success("Компонент удален")
    } catch (err) {
      toast.error("Ошибка при удалении компонента")
      console.error('Error deleting component:', err)
    }
  }

  const handleAddComponent = async () => {
    if (!newComponent.name.trim()) {
      toast.error("Введите название компонента")
      return
    }
    
    try {
      const addedComponent = await productComponentsApi.add(parseInt(id!), {
        name: newComponent.name,
        description: newComponent.description,
        component_type: newComponent.componentType,
        quantity: newComponent.quantity,
        unit: newComponent.unit,
        unit_cost: newComponent.unitCost,
        unit_price: newComponent.unitPrice
      })
      
      setComponents(prev => [...prev, addedComponent])
      setShowAddComponent(false)
      
      // Reset form
      setNewComponent({
        name: '',
        description: '',
        componentType: 'flower',
        quantity: 1,
        unit: 'шт',
        unitCost: 0,
        unitPrice: 0
      })
      
      toast.success("Компонент добавлен")
    } catch (err) {
      toast.error("Ошибка при добавлении компонента")
      console.error('Error adding component:', err)
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
              {/* Components management */}
              {components.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Текущий состав:</h4>
                    <Button size="sm" variant="outline" onClick={() => setShowAddComponent(true)}>
                      + Добавить компонент
                    </Button>
                  </div>
                  {components.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex-1">
                        <div className="font-medium">{comp.name}</div>
                        {comp.description && (
                          <div className="text-sm text-muted-foreground">{comp.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {comp.componentType === 'flower' && '🌹 Цветок'}
                          {comp.componentType === 'material' && '🎀 Материал'}
                          {comp.componentType === 'service' && '👨‍🎨 Услуга'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => updateComponentQuantity(comp.id, comp.quantity - 1)}>-</Button>
                            <span className="font-medium min-w-[60px] text-center">{comp.quantity} {comp.unit}</span>
                            <Button size="sm" variant="ghost" onClick={() => updateComponentQuantity(comp.id, comp.quantity + 1)}>+</Button>
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            {comp.unitPrice.toLocaleString()} ₸ / {comp.unit}
                          </div>
                          {comp.totalPrice > 0 && (
                            <div className="text-sm font-semibold text-center">
                              = {comp.totalPrice.toLocaleString()} ₸
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => deleteComponent(comp.id)}>
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Состав не указан</p>
                  <Button size="sm" variant="outline" onClick={() => setShowAddComponent(true)}>
                    + Добавить первый компонент
                  </Button>
                </div>
              )}
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

      {/* Add Component Modal */}
      <Dialog open={showAddComponent} onOpenChange={setShowAddComponent}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить компонент</DialogTitle>
            <DialogDescription>
              Добавьте новый компонент в состав товара
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="componentName">Название</Label>
              <Input
                id="componentName"
                placeholder="Например: Роза красная 60см"
                value={newComponent.name}
                onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="componentDescription">Описание (необязательно)</Label>
              <Input
                id="componentDescription"
                placeholder="Дополнительная информация"
                value={newComponent.description}
                onChange={(e) => setNewComponent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="componentType">Тип компонента</Label>
              <Select
                value={newComponent.componentType}
                onValueChange={(value) => setNewComponent(prev => ({ ...prev, componentType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flower">🌹 Цветок</SelectItem>
                  <SelectItem value="material">🎀 Материал</SelectItem>
                  <SelectItem value="service">👨‍🎨 Услуга</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="componentQuantity">Количество</Label>
                <Input
                  id="componentQuantity"
                  type="number"
                  min="1"
                  value={newComponent.quantity}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="componentUnit">Единица</Label>
                <Input
                  id="componentUnit"
                  placeholder="шт, см, кг"
                  value={newComponent.unit}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="componentUnitCost">Себестоимость за единицу</Label>
                <Input
                  id="componentUnitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newComponent.unitCost}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="componentUnitPrice">Цена за единицу</Label>
                <Input
                  id="componentUnitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newComponent.unitPrice}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddComponent(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddComponent}>
              Добавить компонент
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}