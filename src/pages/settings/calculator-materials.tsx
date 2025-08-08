import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

import { calculatorApi } from "@/lib/api"

interface DecorativeMaterial {
  id: number
  name: string
  category?: string
  price: number
  unit: string
  is_active: boolean
  in_stock: boolean
}

interface CalculatorSettings {
  default_labor_cost: number
  min_margin_percent: number
  recommended_margin_percent: number
  premium_margin_percent: number
}

export function CalculatorMaterialsPage() {
  const [materials, setMaterials] = useState<DecorativeMaterial[]>([])
  const [settings, setSettings] = useState<CalculatorSettings>({
    default_labor_cost: 2000,
    min_margin_percent: 30,
    recommended_margin_percent: 50,
    premium_margin_percent: 100
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<DecorativeMaterial | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "packaging",
    price: 0,
    unit: "шт",
    is_active: true,
    in_stock: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load materials
      const materialsResponse = await calculatorApi.getMaterials()
      if (materialsResponse.items) {
        setMaterials(materialsResponse.items)
      }
      
      // Load settings
      const settingsResponse = await calculatorApi.getSettings()
      if (settingsResponse) {
        setSettings(settingsResponse)
      }
    } catch (error) {
      // Error is handled by toast notification
      toast.error("Не удалось загрузить данные")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMaterial = async () => {
    try {
      const newMaterial = await calculatorApi.createMaterial(formData)
      setMaterials([...materials, newMaterial])
      toast.success("Материал добавлен")
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      // Error is handled by toast notification
      toast.error("Не удалось добавить материал")
    }
  }

  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return
    
    try {
      const updated = await calculatorApi.updateMaterial(editingMaterial.id, formData)
      setMaterials(materials.map(m => m.id === updated.id ? updated : m))
      toast.success("Материал обновлен")
      setEditingMaterial(null)
      resetForm()
    } catch (error) {
      // Error is handled by toast notification
      toast.error("Не удалось обновить материал")
    }
  }

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Удалить этот материал?")) return
    
    try {
      await calculatorApi.deleteMaterial(id)
      setMaterials(materials.filter(m => m.id !== id))
      toast.success("Материал удален")
    } catch (error) {
      // Error is handled by toast notification
      toast.error("Не удалось удалить материал")
    }
  }

  const handleUpdateSettings = async () => {
    try {
      const updated = await calculatorApi.updateSettings(settings)
      setSettings(updated)
      toast.success("Настройки сохранены")
    } catch (error) {
      // Error is handled by toast notification
      toast.error("Не удалось сохранить настройки")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "packaging",
      price: 0,
      unit: "шт",
      is_active: true,
      in_stock: true
    })
  }

  const openEditDialog = (material: DecorativeMaterial) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      category: material.category || "packaging",
      price: material.price,
      unit: material.unit,
      is_active: material.is_active,
      in_stock: material.in_stock
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      packaging: "Упаковка",
      ribbon: "Лента",
      card: "Открытка",
      topper: "Топпер",
      other: "Другое"
    }
    return labels[category || "other"] || category
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Настройки калькулятора</h1>
          <p className="text-muted-foreground">
            Управление декоративными материалами и настройками расчета
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить материал
        </Button>
      </div>

      {/* Calculator Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки расчета</CardTitle>
          <CardDescription>
            Базовые параметры для калькулятора букетов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="labor-cost">Стоимость работы по умолчанию</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="labor-cost"
                  type="number"
                  value={settings.default_labor_cost}
                  onChange={(e) => setSettings({
                    ...settings,
                    default_labor_cost: Number(e.target.value)
                  })}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">тенге</span>
              </div>
            </div>
            
            <div>
              <Label>Рекомендации по наценке</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Минимум:</span>
                  <Input
                    type="number"
                    value={settings.min_margin_percent}
                    onChange={(e) => setSettings({
                      ...settings,
                      min_margin_percent: Number(e.target.value)
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Рекомендуем:</span>
                  <Input
                    type="number"
                    value={settings.recommended_margin_percent}
                    onChange={(e) => setSettings({
                      ...settings,
                      recommended_margin_percent: Number(e.target.value)
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Премиум:</span>
                  <Input
                    type="number"
                    value={settings.premium_margin_percent}
                    onChange={(e) => setSettings({
                      ...settings,
                      premium_margin_percent: Number(e.target.value)
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleUpdateSettings}>
              <Save className="mr-2 h-4 w-4" />
              Сохранить настройки
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Декоративные материалы</CardTitle>
          <CardDescription>
            Материалы, доступные для выбора в калькуляторе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Единица</TableHead>
                <TableHead>В наличии</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getCategoryLabel(material.category)}</TableCell>
                  <TableCell>{formatCurrency(material.price)}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    <Switch
                      checked={material.in_stock}
                      onCheckedChange={async (checked) => {
                        try {
                          const updated = await calculatorApi.updateMaterial(material.id, {
                            in_stock: checked
                          })
                          setMaterials(materials.map(m => 
                            m.id === material.id ? { ...m, in_stock: checked } : m
                          ))
                        } catch (error) {
                          toast.error("Не удалось обновить статус")
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={material.is_active}
                      onCheckedChange={async (checked) => {
                        try {
                          const updated = await calculatorApi.updateMaterial(material.id, {
                            is_active: checked
                          })
                          setMaterials(materials.map(m => 
                            m.id === material.id ? { ...m, is_active: checked } : m
                          ))
                        } catch (error) {
                          toast.error("Не удалось обновить статус")
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingMaterial} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false)
          setEditingMaterial(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "Редактировать материал" : "Добавить материал"}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial ? "Измените информацию о материале" : "Добавьте новый декоративный материал"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Упаковка крафт"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="packaging">Упаковка</SelectItem>
                  <SelectItem value="ribbon">Лента</SelectItem>
                  <SelectItem value="card">Открытка</SelectItem>
                  <SelectItem value="topper">Топпер</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Цена</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground">тенге</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="шт"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="in-stock">В наличии</Label>
                <Switch
                  id="in-stock"
                  checked={formData.in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Активен</Label>
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingMaterial(null)
              resetForm()
            }}>
              Отмена
            </Button>
            <Button onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}>
              {editingMaterial ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}