import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Package, Eye, Archive } from 'lucide-react'
import { suppliesApi } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default function SuppliesList() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('active')

  const { data: suppliesData, isLoading } = useQuery({
    queryKey: ['supplies', status],
    queryFn: () => suppliesApi.getSupplies({ status: status === 'all' ? undefined : status })
  })

  const supplies = suppliesData?.items || []

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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Поставки</h1>
        <Button onClick={() => navigate('/supplies/import')}>
          <Plus className="mr-2 h-4 w-4" />
          Новая поставка
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="archived">Архив</TabsTrigger>
          <TabsTrigger value="all">Все</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Загрузка...</div>
            </div>
          ) : supplies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Нет поставок</p>
                <p className="text-muted-foreground mb-4">
                  {status === 'active' ? 'Нет активных поставок' : 'Нет архивных поставок'}
                </p>
                <Button onClick={() => navigate('/supplies/import')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать поставку
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {supplies.map((supply) => (
                <Card key={supply.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Поставка #{supply.id}
                          {supply.supplier && ` - ${supply.supplier}`}
                        </CardTitle>
                        <CardDescription>
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
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Детали
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
    </div>
  )
}