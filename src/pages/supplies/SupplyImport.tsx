import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowLeft, Upload, AlertCircle, Check, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { suppliesApi } from '@/lib/api'
import type { SupplyItemImport, FlowerCategory, SupplyCreate } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'

export default function SupplyImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [importText, setImportText] = useState('')
  const [supplier, setSupplier] = useState('')
  const [farm, setFarm] = useState('')
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date())
  const [currency, setCurrency] = useState('KZT')
  const [rate, setRate] = useState(1)
  const [comment, setComment] = useState('')
  const [preview, setPreview] = useState<{
    items: SupplyItemImport[]
    totalCost: number
    errors: string[]
  } | null>(null)

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['flowerCategories'],
    queryFn: suppliesApi.getCategories
  })

  // Parse mutation
  const parseMutation = useMutation({
    mutationFn: ({ text, supplier }: { text: string; supplier?: string }) =>
      suppliesApi.parseSupplyText(text, supplier),
    onSuccess: (data) => {
      setPreview(data)
    }
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (supply: SupplyCreate) => suppliesApi.importSupply(supply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      navigate('/supplies')
    }
  })

  const handleParse = () => {
    if (!importText.trim()) return
    parseMutation.mutate({ text: importText, supplier })
  }

  const handleCategoryChange = (index: number, categoryId: string) => {
    if (!preview) return

    const category = categories.find(c => c.id === parseInt(categoryId))
    if (!category) return

    const updatedItems = [...preview.items]
    updatedItems[index] = {
      ...updatedItems[index],
      categoryId: category.id,
      categoryName: category.name,
      retailPrice: Math.round(updatedItems[index].purchasePrice * (1 + category.markupPercentage / 100) / 10) * 10
    }

    setPreview({
      ...preview,
      items: updatedItems
    })
  }

  const handleImport = () => {
    if (!preview) return

    const supply: SupplyCreate = {
      supplier,
      farm,
      deliveryDate,
      currency,
      rate,
      comment,
      items: preview.items.map(item => ({
        flowerName: item.flowerName,
        heightCm: item.heightCm,
        purchasePrice: item.purchasePrice,
        quantity: item.quantity,
        categoryId: item.categoryId
      }))
    }

    importMutation.mutate(supply)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/supplies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Импорт поставки</h1>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Данные поставки</CardTitle>
            <CardDescription>
              Вставьте список товаров в формате: Название высота цена количество
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Поставщик</Label>
                <Input
                  id="supplier"
                  placeholder="Например: ТОО Цветы Алматы"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="farm">Ферма</Label>
                <Input
                  id="farm"
                  placeholder="Например: Green Valley"
                  value={farm}
                  onChange={(e) => setFarm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Дата поставки</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "dd.MM.yyyy") : <span>Выберите дату</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={(date) => date && setDeliveryDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="currency">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KZT">KZT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rate">Курс</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 1)}
                    disabled={currency === 'KZT'}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Комментарий</Label>
              <Textarea
                id="comment"
                placeholder="Дополнительная информация о поставке"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20"
              />
            </div>

            <div>
              <Label htmlFor="import-text">Список товаров</Label>
              <Textarea
                id="import-text"
                placeholder="Фридом 60 250 450
Ред Наоми 70 300 200
Эксплорер 80 350 150"
                className="h-48 font-mono"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Формат импорта:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Название сорта + высота (см) - одним текстом</li>
                  <li>Цена закупки (тенге)</li>
                  <li>Количество (штук)</li>
                  <li>Разделитель - пробел</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleParse}
              disabled={!importText.trim() || parseMutation.isPending}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {parseMutation.isPending ? 'Обработка...' : 'Обработать и показать превью'}
            </Button>
          </CardContent>
        </Card>

        {/* Errors */}
        {preview && preview.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Ошибки при разборе:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {preview.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {preview && preview.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр импорта</CardTitle>
              <CardDescription>
                Проверьте данные и выберите категории для автоматического расчета розничных цен
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Высота</TableHead>
                    <TableHead>Закупка</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Наценка</TableHead>
                    <TableHead>Розница</TableHead>
                    <TableHead>Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.flowerName}</TableCell>
                      <TableCell>{item.heightCm} см</TableCell>
                      <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Select
                          value={item.categoryId?.toString() || ''}
                          onValueChange={(value) => handleCategoryChange(index, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.categoryId && (
                          <span className="text-sm text-muted-foreground">
                            {categories.find(c => c.id === item.categoryId)?.markupPercentage}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.retailPrice ? (
                          <span className="font-medium">{formatCurrency(item.retailPrice)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.purchasePrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Итого: {formatCurrency(preview.totalCost)}
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || preview.items.some(item => !item.categoryId)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {importMutation.isPending ? 'Сохранение...' : 'Подтвердить и сохранить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}