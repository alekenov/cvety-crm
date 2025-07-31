import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Archive, Package, TrendingUp } from 'lucide-react'
import { suppliesApi } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default function SupplyDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: supply, isLoading } = useQuery({
    queryKey: ['supply', id],
    queryFn: () => suppliesApi.getSupply(parseInt(id!)),
    enabled: !!id
  })

  const archiveMutation = useMutation({
    mutationFn: () => suppliesApi.archiveSupply(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply', id] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!supply) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Поставка не найдена</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getTotalRemaining = () => {
    return supply.items.reduce((sum, item) => sum + item.remainingQuantity, 0)
  }

  const getTotalItems = () => {
    return supply.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getUtilizationRate = () => {
    const total = getTotalItems()
    const remaining = getTotalRemaining()
    return total > 0 ? Math.round(((total - remaining) / total) * 100) : 0
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/supplies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Поставка #{supply.id}
              {supply.supplier && ` - ${supply.supplier}`}
            </h1>
            <p className="text-muted-foreground">
              {formatDateTime(supply.createdAt)}
              {supply.createdBy && ` • ${supply.createdBy}`}
            </p>
          </div>
        </div>
        {supply.status === 'active' && (
          <Button
            variant="outline"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            <Archive className="mr-2 h-4 w-4" />
            {archiveMutation.isPending ? 'Архивирование...' : 'В архив'}
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supply.status === 'active' ? (
                <Badge variant="default" className="text-lg px-3 py-1">Активная</Badge>
              ) : (
                <Badge variant="secondary" className="text-lg px-3 py-1">Архив</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Позиций</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supply.items.length}</div>
            <p className="text-xs text-muted-foreground">наименований</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Использовано</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUtilizationRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {getTotalItems() - getTotalRemaining()} из {getTotalItems()} шт
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сумма закупки</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(supply.totalCost)}</div>
            <p className="text-xs text-muted-foreground">общая стоимость</p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Позиции поставки</CardTitle>
          <CardDescription>
            Детальная информация о товарах в поставке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Закупка</TableHead>
                <TableHead>Наценка</TableHead>
                <TableHead>Розница</TableHead>
                <TableHead>Поступило</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Использовано</TableHead>
                <TableHead>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supply.items.map((item) => (
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
                  <TableCell>
                    {item.category ? (
                      <span className="text-sm text-muted-foreground">
                        {item.category.markupPercentage}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.retailPrice)}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <span className={item.remainingQuantity === 0 ? 'text-muted-foreground' : ''}>
                      {item.remainingQuantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {item.quantity - item.remainingQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {supply.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Примечания</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{supply.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}