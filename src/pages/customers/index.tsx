import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Phone, ShoppingBag, User } from "lucide-react"
import { toast } from "sonner"

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

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Айгерим Сатпаева",
    phone: "+7 (707) 123-45-67",
    email: "aigerim@example.com",
    addresses: ["ул. Абая 150, кв 25", "пр. Достык 89, офис 301"],
    notes: "Предпочитает розы и пионы. Аллергия на лилии.",
    preferences: "Светлые тона, минималистичные букеты",
    importantDates: [
      { date: "15.03", description: "День рождения" },
      { date: "20.09", description: "Годовщина свадьбы" }
    ],
    ordersCount: 12,
    totalSpent: 185000,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-26")
  },
  {
    id: "2",
    name: "Самат Нурпеисов",
    phone: "+7 (777) 890-12-34",
    email: "samat@company.kz",
    addresses: ["мкр. Самал-2, д. 77"],
    notes: "Корпоративный клиент. Заказывает букеты для офиса каждую неделю.",
    ordersCount: 45,
    totalSpent: 520000,
    createdAt: new Date("2022-06-10"),
    updatedAt: new Date("2024-01-25")
  },
  {
    id: "3",
    name: "Динара Касымова",
    phone: "+7 (701) 555-44-33",
    addresses: ["ул. Жандосова 98, кв 45"],
    notes: "Часто заказывает на доставку маме",
    importantDates: [
      { date: "08.03", description: "8 марта для мамы" }
    ],
    ordersCount: 8,
    totalSpent: 95000,
    createdAt: new Date("2023-08-20"),
    updatedAt: new Date("2024-01-20")
  }
]

export function CustomersPage() {
  const navigate = useNavigate()
  const [customers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  })

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Заполните обязательные поля")
      return
    }

    toast.success("Клиент добавлен")
    setIsAddDialogOpen(false)
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: ""
    })
  }

  const handleCreateOrder = (customerId: string) => {
    toast.info(`Создание заказа для клиента #${customerId}`)
    // Navigate to orders page with customer pre-selected
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <Button onClick={handleAddCustomer}>
                Добавить
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
            {filteredCustomers.map((customer) => (
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
        <span>Всего клиентов: {filteredCustomers.length}</span>
        <span>•</span>
        <span>
          Общая сумма заказов: {formatCurrency(
            filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0)
          )}
        </span>
      </div>
    </div>
  )
}