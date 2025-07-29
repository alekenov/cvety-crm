import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { 
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Plus,
  ChevronRight,
  User,
  Star,
  Edit2,
  Home,
  Building
} from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { Customer, Order } from "@/lib/types"
import { customersApi, ordersApi } from "@/lib/api"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants"

interface MobileCustomerDetailProps {
  className?: string
}

export function MobileCustomerDetail({ className }: MobileCustomerDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editSheet, setEditSheet] = useState<"notes" | "contact" | "address" | null>(null)

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('No customer ID')
      return customersApi.getById(id)
    },
    enabled: !!id
  })

  // Fetch customer orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: async () => {
      if (!id) throw new Error('No customer ID')
      return customersApi.getOrders(id, { limit: 10 })
    },
    enabled: !!id
  })

  const orders = ordersData?.items || []

  const handleCall = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone.replace(/\D/g, '')}`
    }
  }

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const phone = customer.phone.replace(/\D/g, '')
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  const handleEmail = () => {
    if (customer?.email) {
      window.location.href = `mailto:${customer.email}`
    }
  }

  const handleNewOrder = () => {
    navigate('/orders/new', { state: { customerPhone: customer?.phone } })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isLoading = customerLoading || ordersLoading

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        {/* Header Skeleton */}
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Клиент не найден</p>
          <Button onClick={() => navigate("/customers")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    )
  }

  const customerTier = customer.totalSpent > 100000 ? 'VIP' : 'Regular'
  const hasNotes = customer.notes || customer.preferences

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/customers")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Клиент</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditSheet("contact")}
            className="h-10 w-10"
          >
            <Edit2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Contact Card */}
      <div className="p-4">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{customer.name}</h2>
                <Badge variant={customerTier === 'VIP' ? 'default' : 'secondary'}>
                  {customerTier === 'VIP' ? (
                    <>
                      <Star className="h-3 w-3 mr-1" />
                      VIP клиент
                    </>
                  ) : (
                    'Постоянный клиент'
                  )}
                </Badge>
              </div>

              {hasNotes && (
                <p className="text-sm text-muted-foreground italic">
                  "{customer.preferences || customer.notes}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="default"
            className="h-12"
            onClick={handleCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Позвонить
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          {customer.email && (
            <Button
              variant="outline"
              className="h-12 col-span-2"
              onClick={handleEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardDescription>Всего заказов</CardDescription>
              <CardTitle className="text-2xl">{customer.ordersCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardDescription>Общая сумма</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(customer.totalSpent)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Notes & Preferences */}
        {hasNotes && (
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
            onClick={() => setEditSheet("notes")}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Заметки и предпочтения</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {customer.preferences || customer.notes}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Addresses */}
        <button
          className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
          onClick={() => setEditSheet("address")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Адреса доставки</p>
              <p className="text-sm text-muted-foreground">
                {customer.addresses?.length || 0} адресов
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Important Dates */}
        {customer.importantDates && customer.importantDates.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">Важные даты</p>
            </div>
            <div className="space-y-2 ml-13">
              {customer.importantDates.map((date, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{date.date}</span>
                  <span className="text-muted-foreground"> — {date.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Order History */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            История заказов
          </h3>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate(`/orders?customer=${id}`)}
          >
            Все заказы
          </Button>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Card
                key={order.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Заказ #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "dd.MM.yyyy")}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Нет заказов</p>
            </div>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={handleNewOrder}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Edit Sheets */}
      {/* Notes Sheet */}
      <Sheet open={editSheet === "notes"} onOpenChange={(open) => !open && setEditSheet(null)}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Заметки и предпочтения</SheetTitle>
            <SheetDescription>
              Информация о предпочтениях клиента
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Предпочтения</h4>
              <p className="text-sm text-muted-foreground">
                {customer.preferences || "Не указаны"}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Заметки</h4>
              <p className="text-sm text-muted-foreground">
                {customer.notes || "Нет заметок"}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Address Sheet */}
      <Sheet open={editSheet === "address"} onOpenChange={(open) => !open && setEditSheet(null)}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Адреса доставки</SheetTitle>
            <SheetDescription>
              Сохраненные адреса клиента
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full mt-6">
            <div className="space-y-3 pb-20">
              {customer.addresses?.map((address, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {index === 0 ? (
                        <Home className="h-5 w-5 text-primary" />
                      ) : (
                        <Building className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {index === 0 ? 'Домашний адрес' : `Адрес ${index + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{address}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {(!customer.addresses || customer.addresses.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Нет сохраненных адресов</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}