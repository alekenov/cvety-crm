import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Phone, ShoppingBag, User } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Customer } from "@/lib/types"
import { customersApi } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"

// API response type
interface CustomerApiResponse {
  id: number
  name: string
  phone: string
  email: string | null
  notes: string | null
  preferences: string | null
  source: string | null
  orders_count: number
  total_spent: number
  last_order_date: string | null
  created_at: string
  updated_at: string
  addresses: Array<{
    id: number
    address: string
    label: string | null
    usage_count: number
  }>
  important_dates: Array<{
    id: number
    date: string
    description: string
  }>
}

export function CustomersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query for customers
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', debouncedSearchQuery, currentPage],
    queryFn: async () => {
      const response = await customersApi.getAll({
        search: debouncedSearchQuery || undefined,
        page: currentPage,
        limit: 20
      })

      // Convert snake_case API response to camelCase
      const rawResponse = response as unknown as { items: CustomerApiResponse[], total: number }
      return {
        total: rawResponse.total,
        items: rawResponse.items.map((customer) => ({
          id: customer.id.toString(),
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
          preferences: customer.preferences,
          addresses: customer.addresses.map(addr => addr.address),
          importantDates: customer.important_dates.map(date => ({
            date: date.date,
            description: date.description
          })),
          ordersCount: customer.orders_count,
          totalSpent: customer.total_spent,
          createdAt: new Date(customer.created_at),
          updatedAt: new Date(customer.updated_at)
        })) as Customer[]
      }
    }
  })

  // Mutation for creating customer
  const createMutation = useMutation({
    mutationFn: (customerData: typeof newCustomer) => {
      const createData: any = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        notes: customerData.notes || undefined
      }

      return customersApi.create(createData)
    },
    onSuccess: (newCustomerData, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Клиент ${variables.name} добавлен`)
      setIsAddDialogOpen(false)
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
      })

      // Add address if provided
      if (variables.address) {
        customersApi.addAddress(newCustomerData.id, { 
          address: variables.address,
          label: 'Основной'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['customers'] })
        })
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Ошибка при создании клиента'
      toast.error(message)
    }
  })

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Заполните обязательные поля")
      return
    }

    createMutation.mutate(newCustomer)
  }

  const handleCreateOrder = (customerId: string) => {
    toast.info(`Создание заказа для клиента #${customerId}`)
    // Navigate to orders page with customer pre-selected
    navigate(`/orders/new?customerId=${customerId}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Calculate pagination
  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const customers = data?.items || []

  // Loading and Error states
  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return <ErrorState
      message={error instanceof Error ? error.message : 'Ошибка загрузки клиентов'}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
    />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить клиента
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый клиент</DialogTitle>
              <DialogDescription>
                Добавьте информацию о новом клиенте
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  ФИО *
                </Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Телефон *
                </Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Адрес
                </Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Заметки
                </Label>
                <Input
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={handleAddCustomer}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, телефону или email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead>Заказы</TableHead>
              <TableHead>Общая сумма</TableHead>
              <TableHead>Последний заказ</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow 
                key={customer.id}
                className="cursor-pointer"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {customer.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="text-xs text-muted-foreground">
                        {customer.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    {customer.ordersCount}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(customer.updatedAt).toLocaleDateString('ru-KZ')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Действия
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleCreateOrder(customer.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Создать заказ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Открыть карточку
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Всего клиентов: {data?.total || 0}</span>
        <span>•</span>
        <span>
          Общая сумма заказов: {formatCurrency(
            customers.reduce((sum, c) => sum + c.totalSpent, 0)
          )}
        </span>
      </div>
    </div>
  )
}