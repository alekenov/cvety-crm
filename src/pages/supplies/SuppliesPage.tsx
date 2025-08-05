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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Upload, AlertCircle, Check, CalendarIcon, Package, Eye, CheckCircle, Plus, ChevronDown, Info, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { suppliesApi } from '@/lib/api'
import type { SupplyItemImport, FlowerCategory, SupplyCreate } from '@/lib/types'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'

export default function SuppliesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('import')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Import form state
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
  const [lastCreatedSupplyId, setLastCreatedSupplyId] = useState<number | null>(null)
  
  // List state
  const [listStatus, setListStatus] = useState<string>('active')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['flowerCategories'],
    queryFn: suppliesApi.getCategories
  })

  // Fetch supplies for list
  const { data: suppliesData, isLoading: isLoadingSupplies } = useQuery({
    queryKey: ['supplies', listStatus],
    queryFn: () => suppliesApi.getSupplies({ status: listStatus === 'all' ? undefined : listStatus }),
    enabled: activeTab === 'history'
  })

  const supplies = suppliesData?.items || []

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      setLastCreatedSupplyId(data.id)
      toast.success('Поставка успешно создана!')
      
      // Reset form after success
      setImportText('')
      setPreview(null)
      setSupplier('')
      setFarm('')
      setComment('')
      setShowAdvanced(false)
    }
  })

  const handleParse = () => {
    if (!importText.trim() || !supplier.trim()) return
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
    if (!preview || !supplier) {
      toast.error('Заполните поставщика')
      return
    }

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

  const toggleItemExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Активная</Badge>
      case 'archived':
        return <Badge variant="secondary">Архив</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTotalRemaining = (supply: any) => {
    return supply.items.reduce((sum: number, item: any) => sum + item.remainingQuantity, 0)
  }

  const getTotalItems = (supply: any) => {
    return supply.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Поставки</h1>
        <p className="text-muted-foreground mt-2 hidden md:block">
          Управление поставками и остатками на складе
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 md:mb-6 w-full md:w-auto">
          <TabsTrigger value="import" className="flex-1 md:flex-none">Новая поставка</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 md:flex-none">История</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4 md:space-y-6">
          {/* Success message */}
          {lastCreatedSupplyId && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span>Поставка успешно создана!</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/supplies/${lastCreatedSupplyId}`)}
                    >
                      Посмотреть
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLastCreatedSupplyId(null)}
                    >
                      Создать ещё
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Form */}
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Данные поставки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Essential fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier">Поставщик *</Label>
                  <Input
                    id="supplier"
                    placeholder="Например: ТОО Цветы Алматы"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    required
                    className="w-full md:max-w-md"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="import-text">Список товаров *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[250px]">
                          <p className="font-semibold mb-1">Формат импорта:</p>
                          <ul className="text-sm space-y-1">
                            <li>• Каждый товар на новой строке</li>
                            <li>• Название высота цена кол-во</li>
                            <li>• Пример: Фридом 60 250 450</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="import-text"
                    placeholder="Фридом 60 250 450
Ред Наоми 70 300 200
Эксплорер 80 350 150"
                    className="h-32 md:h-48 font-mono text-sm w-full md:max-w-2xl"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span>Дополнительные настройки</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farm">Ферма</Label>
                      <Input
                        id="farm"
                        placeholder="Например: Green Valley"
                        value={farm}
                        onChange={(e) => setFarm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>

                    <div>
                      <Label>Дата поставки</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full max-w-xs justify-start text-left font-normal",
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Валюта</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency" className="max-w-[200px]">
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
                        className="max-w-[150px]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comment">Комментарий</Label>
                    <Textarea
                      id="comment"
                      placeholder="Дополнительная информация о поставке"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="h-20 w-full md:max-w-xl"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button
                onClick={handleParse}
                disabled={!importText.trim() || !supplier.trim() || parseMutation.isPending}
                className="w-full md:max-w-sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                {parseMutation.isPending ? 'Обработка...' : 'Показать превью'}
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

          {/* Preview - Desktop Table */}
          {preview && preview.items.length > 0 && (
            <>
              {/* Desktop preview */}
              <Card className="hidden md:block">
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
                              <SelectTrigger className="max-w-[150px]">
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
                          <TableCell>{formatCurrency(item.purchasePrice * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile preview */}
              <div className="md:hidden space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Предпросмотр импорта</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {preview.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{item.flowerName}</p>
                            <p className="text-sm text-muted-foreground">{item.heightCm} см</p>
                          </div>
                          <Badge variant="outline">{item.quantity} шт</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Закупка:</span>
                            <span>{formatCurrency(item.purchasePrice)}</span>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Категория</Label>
                            <Select
                              value={item.categoryId?.toString() || ''}
                              onValueChange={(value) => handleCategoryChange(index, value)}
                            >
                              <SelectTrigger className="h-8">
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
                          </div>

                          {item.retailPrice && (
                            <div className="flex justify-between text-sm">
                              <span>Розница:</span>
                              <span className="font-medium">{formatCurrency(item.retailPrice)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Summary and actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Всего позиций: {preview.items.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Общее количество: {preview.items.reduce((sum, item) => sum + item.quantity, 0)} шт
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-bold">{formatCurrency(preview.totalCost)}</p>
                      <p className="text-sm text-muted-foreground">Общая сумма закупки</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row gap-2 md:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreview(null)
                        setImportText('')
                      }}
                      className="w-full md:w-auto"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {importMutation.isPending ? 'Создание...' : 'Создать поставку'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 md:space-y-6">
          <Tabs value={listStatus} onValueChange={setListStatus}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="active" className="flex-1 md:flex-none">Активные</TabsTrigger>
              <TabsTrigger value="archived" className="flex-1 md:flex-none">Архив</TabsTrigger>
              <TabsTrigger value="all" className="flex-1 md:flex-none">Все</TabsTrigger>
            </TabsList>

            <TabsContent value={listStatus} className="mt-4 md:mt-6">
              {isLoadingSupplies ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Загрузка...</div>
                </div>
              ) : supplies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Нет поставок</p>
                    <p className="text-muted-foreground mb-4 text-center">
                      {listStatus === 'active' ? 'Нет активных поставок' : 'Нет архивных поставок'}
                    </p>
                    <Button onClick={() => setActiveTab('import')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Создать поставку
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {supplies.map((supply) => (
                    <Card key={supply.id}>
                      <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg">
                              Поставка #{supply.id}
                              {supply.supplier && ` - ${supply.supplier}`}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {formatDateTime(supply.createdAt)}
                              {supply.createdBy && ` • ${supply.createdBy}`}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(supply.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/supplies/${supply.id}`)}
                              className="hidden md:flex"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Детали
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Mobile: Card summary */}
                        <div className="md:hidden space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Позиций</p>
                              <p className="font-semibold">{supply.items.length}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Всего штук</p>
                              <p className="font-semibold">{getTotalItems(supply)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Остаток</p>
                              <p className="font-semibold">{getTotalRemaining(supply)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Сумма</p>
                              <p className="font-semibold">{formatCurrency(supply.totalCost)}</p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => toggleItemExpanded(supply.id)}
                          >
                            <span>Показать товары</span>
                            <ChevronRight className={cn("h-4 w-4 transition-transform", 
                              expandedItems.has(supply.id) && "rotate-90")} />
                          </Button>

                          {expandedItems.has(supply.id) && (
                            <div className="space-y-2 pt-2 border-t">
                              {supply.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.flowerName} {item.heightCm}см</span>
                                  <span className="text-muted-foreground">
                                    {item.remainingQuantity}/{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/supplies/${supply.id}`)}
                            className="w-full"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Подробнее
                          </Button>
                        </div>

                        {/* Desktop: Table view */}
                        <div className="hidden md:block">
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Позиций</p>
                              <p className="text-lg font-semibold">{supply.items.length}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Всего штук</p>
                              <p className="text-lg font-semibold">{getTotalItems(supply)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Остаток</p>
                              <p className="text-lg font-semibold">{getTotalRemaining(supply)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Сумма закупки</p>
                              <p className="text-lg font-semibold">{formatCurrency(supply.totalCost)}</p>
                            </div>
                          </div>

                          {/* Preview of items */}
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Товар</TableHead>
                                  <TableHead>Категория</TableHead>
                                  <TableHead>Закупка</TableHead>
                                  <TableHead>Розница</TableHead>
                                  <TableHead>Кол-во</TableHead>
                                  <TableHead>Остаток</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {supply.items.slice(0, 3).map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                      {item.flowerName} {item.heightCm}см
                                    </TableCell>
                                    <TableCell>
                                      {item.category ? (
                                        <Badge variant="outline">{item.category.name}</Badge>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                                    <TableCell>{formatCurrency(item.retailPrice)}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                      <span className={item.remainingQuantity === 0 ? 'text-muted-foreground' : ''}>
                                        {item.remainingQuantity}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {supply.items.length > 3 && (
                              <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground text-center">
                                И еще {supply.items.length - 3} позиций...
                              </div>
                            )}
                          </div>
                        </div>

                        {supply.notes && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">{supply.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}