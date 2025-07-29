import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ShoppingBag,
  Heart,
  Edit,
  MoreHorizontal,
  Plus,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  X
} from "lucide-react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MobileCustomerDetail } from "./[id]-mobile"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

import type { Customer, Order } from "@/lib/types"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants"
import { customersApi } from "@/lib/api"

// Mock data for a single customer
const mockCustomer: Customer = {
  id: 1,
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
}

// Mock orders for this customer
const mockOrders: Order[] = [
  {
    id: "101",
    createdAt: new Date("2024-01-25T10:00:00"),
    status: "delivery",
    customerPhone: "+7 (707) 123-45-67",
    recipientPhone: "+7 (777) 999-88-77",
    recipientName: "Мама",
    address: "ул. Розыбакиева 247",
    deliveryMethod: "delivery",
    deliveryWindow: {
      from: new Date("2024-01-26T14:00:00"),
      to: new Date("2024-01-26T16:00:00")
    },
    flowerSum: 25000,
    deliveryFee: 2000,
    total: 27000,
    hasPreDeliveryPhotos: true,
    hasIssue: false,
    trackingToken: "track-101",
    updatedAt: new Date("2024-01-25T15:30:00")
  },
  {
    id: "98",
    createdAt: new Date("2024-01-10T09:00:00"),
    status: "self_pickup",
    customerPhone: "+7 (707) 123-45-67",
    deliveryMethod: "self_pickup",
    deliveryWindow: {
      from: new Date("2024-01-10T18:00:00"),
      to: new Date("2024-01-10T19:00:00")
    },
    flowerSum: 15000,
    deliveryFee: 0,
    total: 15000,
    hasPreDeliveryPhotos: true,
    hasIssue: false,
    trackingToken: "track-98",
    updatedAt: new Date("2024-01-10T17:45:00")
  }
]

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isDatesDialogOpen, setIsDatesDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    notes: "",
    preferences: ""
  })
  const [contactForm, setContactForm] = useState({
    phone: "",
    email: ""
  })
  const [addressForm, setAddressForm] = useState({
    addresses: [] as string[],
    newAddress: ""
  })
  const [datesForm, setDatesForm] = useState({
    dates: [] as Array<{ date: string; description: string }>,
    newDate: "",
    newDescription: ""
  })

  useEffect(() => {
    let cancelled = false
    
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        
        if (!id) return
        
        const customerId = parseInt(id)
        if (isNaN(customerId)) {
          toast.error("Неверный ID клиента")
          return
        }
        
        // Fetch customer data from API
        const customer = await customersApi.getById(id)
        
        if (cancelled) return
        
        setCustomer(customer)
        
        // Fetch customer's orders
        const ordersData = await customersApi.getOrders(id, { limit: 20 })
        
        if (cancelled) return
        
        setOrders(ordersData.items)
        
        // Initialize forms with customer data
        setEditForm({
          notes: customer.notes || "",
          preferences: customer.preferences || ""
        })
        setContactForm({
          phone: customer.phone || "",
          email: customer.email || ""
        })
        setAddressForm({
          addresses: customer.addresses ? [...customer.addresses] : [],
          newAddress: ""
        })
        setDatesForm({
          dates: customer.importantDates ? [...customer.importantDates] : [],
          newDate: "",
          newDescription: ""
        })
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching customer:", error)
          toast.error("Ошибка загрузки данных клиента")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCustomerData()
    
    return () => {
      cancelled = true
    }
  }, [id])

  const handleEditSubmit = () => {
    toast.success("Информация обновлена")
    setIsEditDialogOpen(false)
    if (customer) {
      setCustomer({
        ...customer,
        notes: editForm.notes,
        preferences: editForm.preferences,
        updatedAt: new Date()
      })
    }
  }

  const handleContactSubmit = () => {
    toast.success("Контактная информация обновлена")
    setIsContactDialogOpen(false)
    if (customer) {
      setCustomer({
        ...customer,
        phone: contactForm.phone,
        email: contactForm.email,
        updatedAt: new Date()
      })
    }
  }

  const handleAddressSubmit = () => {
    toast.success("Адреса обновлены")
    setIsAddressDialogOpen(false)
    if (customer) {
      setCustomer({
        ...customer,
        addresses: addressForm.addresses,
        updatedAt: new Date()
      })
    }
  }

  const handleDatesSubmit = () => {
    toast.success("Важные даты обновлены")
    setIsDatesDialogOpen(false)
    if (customer) {
      setCustomer({
        ...customer,
        importantDates: datesForm.dates,
        updatedAt: new Date()
      })
    }
  }

  const addAddress = () => {
    if (addressForm.newAddress.trim()) {
      setAddressForm({
        addresses: [...addressForm.addresses, addressForm.newAddress.trim()],
        newAddress: ""
      })
    }
  }

  const removeAddress = (index: number) => {
    setAddressForm({
      ...addressForm,
      addresses: addressForm.addresses.filter((_, i) => i !== index)
    })
  }

  const addDate = () => {
    if (datesForm.newDate.trim() && datesForm.newDescription.trim()) {
      setDatesForm({
        dates: [...datesForm.dates, {
          date: datesForm.newDate.trim(),
          description: datesForm.newDescription.trim()
        }],
        newDate: "",
        newDescription: ""
      })
    }
  }

  const removeDate = (index: number) => {
    setDatesForm({
      ...datesForm,
      dates: datesForm.dates.filter((_, i) => i !== index)
    })
  }

  const handleCreateOrder = () => {
    toast.info("Создание нового заказа")
    // Navigate to orders page with customer pre-selected
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Клиент не найден</p>
        <Button onClick={() => navigate("/customers")}>
          Вернуться к списку
        </Button>
      </div>
    )
  }

  // Use mobile version on mobile devices
  if (isMobile) {
    return <MobileCustomerDetail />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              Клиент с {format(customer.createdAt, "dd.MM.yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            Новый заказ
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.ordersCount}</div>
            <p className="text-xs text-muted-foreground">
              +2 за последний месяц
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customer.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Средний чек: {formatCurrency(customer.totalSpent / customer.ordersCount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последний заказ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Вчера</div>
            <p className="text-xs text-muted-foreground">
              {format(customer.updatedAt, "dd.MM.yyyy HH:mm")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лояльность</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Высокая</div>
            <p className="text-xs text-muted-foreground">
              Постоянный клиент
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="orders">История заказов</TabsTrigger>
          <TabsTrigger value="preferences">Предпочтения</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Contact Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Контактная информация</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsContactDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Адреса доставки
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddressDialogOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Управление
                  </Button>
                </div>
                <div className="space-y-2">
                  {customer.addresses.map((address, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {address}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Важные даты</CardTitle>
                  <CardDescription>
                    Напоминания для своевременных поздравлений
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDatesDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Управление
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer.importantDates && customer.importantDates.length > 0 ? (
                <div className="space-y-3">
                  {customer.importantDates.map((date, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{date.date}</span>
                      <span className="text-muted-foreground">—</span>
                      <span>{date.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет важных дат</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Заметки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ Заказа</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Получатель</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{format(order.createdAt, "dd.MM.yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.recipientName || "Самовывоз"}
                    </TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Детали
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Предпочтения клиента</CardTitle>
              <CardDescription>
                Информация о вкусах и предпочтениях для персонализации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.preferences && (
                <div>
                  <h4 className="font-medium mb-2">Предпочтения в букетах</h4>
                  <p className="text-sm text-muted-foreground">
                    {customer.preferences}
                  </p>
                </div>
              )}
              {customer.notes && (
                <div>
                  <h4 className="font-medium mb-2">Особые примечания</h4>
                  <p className="text-sm text-muted-foreground">
                    {customer.notes}
                  </p>
                </div>
              )}
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать предпочтения
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать информацию</DialogTitle>
            <DialogDescription>
              Обновите заметки и предпочтения клиента
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Например: Аллергия на лилии..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preferences">Предпочтения</Label>
              <Textarea
                id="preferences"
                value={editForm.preferences}
                onChange={(e) => setEditForm({ ...editForm, preferences: e.target.value })}
                placeholder="Например: Любит пастельные тона..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Edit Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать контактную информацию</DialogTitle>
            <DialogDescription>
              Обновите телефон и email клиента
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleContactSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Management Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Управление адресами доставки</DialogTitle>
            <DialogDescription>
              Добавьте, отредактируйте или удалите адреса
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              {addressForm.addresses.map((address, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm flex-1">{index + 1}. {address}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAddress(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="newAddress">Новый адрес</Label>
              <div className="flex gap-2">
                <Input
                  id="newAddress"
                  value={addressForm.newAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, newAddress: e.target.value })}
                  placeholder="Введите адрес доставки"
                  onKeyPress={(e) => e.key === 'Enter' && addAddress()}
                />
                <Button onClick={addAddress} size="sm">
                  Добавить
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddressSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Important Dates Dialog */}
      <Dialog open={isDatesDialogOpen} onOpenChange={setIsDatesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Управление важными датами</DialogTitle>
            <DialogDescription>
              Добавьте важные даты для напоминаний
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              {datesForm.dates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm flex-1">
                    <strong>{date.date}</strong> — {date.description}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDate(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Новая дата</Label>
              <div className="flex gap-2">
                <Input
                  value={datesForm.newDate}
                  onChange={(e) => setDatesForm({ ...datesForm, newDate: e.target.value })}
                  placeholder="ДД.ММ"
                  className="w-24"
                />
                <Input
                  value={datesForm.newDescription}
                  onChange={(e) => setDatesForm({ ...datesForm, newDescription: e.target.value })}
                  placeholder="Описание (например: День рождения)"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addDate()}
                />
                <Button onClick={addDate} size="sm">
                  Добавить
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDatesDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleDatesSubmit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}