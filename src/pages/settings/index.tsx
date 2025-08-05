import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Building2, 
  Phone, 
  Mail, 
  Clock,
  MapPin,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormShell } from "@/components/ui/form-shell"
import { FORM_WIDTHS, BUTTON_CLASSES } from "@/lib/constants"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
  DialogTrigger,
} from "@/components/ui/dialog"

import type { CompanySettings } from "@/lib/types"
import { settingsApi } from "@/lib/api"

const settingsSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  address: z.string().min(1, "Адрес обязателен"),
  phones: z.array(z.string().min(1, "Телефон обязателен")),
  email: z.string().email("Некорректный email"),
  workingHours: z.object({
    from: z.string().min(1, "Время начала обязательно"),
    to: z.string().min(1, "Время окончания обязательно"),
  }),
})

type SettingsFormValues = z.infer<typeof settingsSchema>


export function SettingsPage() {
  const queryClient = useQueryClient()
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<{ name: string; price: number } | null>(null)
  const [zoneForm, setZoneForm] = useState({ name: "", price: 0 })

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success("Настройки сохранены")
    },
    onError: () => {
      toast.error("Ошибка при сохранении настроек")
    },
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      phones: [],
      email: "",
      workingHours: {
        from: "",
        to: "",
      },
    },
  })

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name,
        address: settings.address,
        phones: settings.phones,
        email: settings.email,
        workingHours: settings.workingHours,
      })
    }
  }, [settings, form])

  const onSubmit = async (values: SettingsFormValues) => {
    if (!settings) return
    
    updateMutation.mutate({
      ...values,
      deliveryZones: settings.deliveryZones,
    })
  }

  const handleAddPhone = () => {
    const currentPhones = form.getValues("phones")
    form.setValue("phones", [...currentPhones, ""])
  }

  const handleRemovePhone = (index: number) => {
    const currentPhones = form.getValues("phones")
    form.setValue("phones", currentPhones.filter((_, i) => i !== index))
  }

  const handleAddZone = () => {
    if (!settings) return
    
    if (!zoneForm.name || zoneForm.price <= 0) {
      toast.error("Заполните все поля")
      return
    }

    let newZones: typeof settings.deliveryZones
    
    if (editingZone) {
      // Update existing zone
      newZones = settings.deliveryZones.map(zone =>
        zone.name === editingZone.name
          ? { name: zoneForm.name, price: zoneForm.price }
          : zone
      )
    } else {
      // Add new zone
      newZones = [...settings.deliveryZones, { name: zoneForm.name, price: zoneForm.price }]
    }

    updateMutation.mutate(
      { deliveryZones: newZones },
      {
        onSuccess: () => {
          toast.success(editingZone ? "Зона доставки обновлена" : "Зона доставки добавлена")
          setIsZoneDialogOpen(false)
          setEditingZone(null)
          setZoneForm({ name: "", price: 0 })
        },
      }
    )
  }

  const handleEditZone = (zone: { name: string; price: number }) => {
    setEditingZone(zone)
    setZoneForm(zone)
    setIsZoneDialogOpen(true)
  }

  const handleDeleteZone = (zoneName: string) => {
    if (!settings) return
    
    updateMutation.mutate(
      {
        deliveryZones: settings.deliveryZones.filter(zone => zone.name !== zoneName)
      },
      {
        onSuccess: () => {
          toast.success("Зона доставки удалена")
        },
      }
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Ошибка загрузки настроек</p>
      </div>
    )
  }

  return (
    <FormShell maxWidth="4xl">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Общие настройки</h1>
          <p className="text-muted-foreground">
            Управление настройками компании
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Информация о компании
              </CardTitle>
              <CardDescription>
                Основная информация о вашей компании
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название компании</FormLabel>
                    <FormControl>
                      <Input {...field} className={FORM_WIDTHS.COMPANY_NAME} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес</FormLabel>
                    <FormControl>
                      <Input {...field} className={FORM_WIDTHS.ADDRESS} />
                    </FormControl>
                    <FormDescription>
                      Юридический адрес компании
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className={FORM_WIDTHS.EMAIL} />
                    </FormControl>
                    <FormDescription>
                      Контактный email для клиентов
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Телефоны
              </CardTitle>
              <CardDescription>
                Контактные телефоны компании
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("phones").map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`phones.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="+7 (___) ___-__-__"
                            className={FORM_WIDTHS.PHONE}
                          />
                        </FormControl>
                        {form.watch("phones").length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemovePhone(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPhone}
                className={BUTTON_CLASSES.FULL_MOBILE}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить телефон
              </Button>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Режим работы
              </CardTitle>
              <CardDescription>
                Время работы компании
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 sm:max-w-md">
                <FormField
                  control={form.control}
                  name="workingHours.from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Время открытия</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className={FORM_WIDTHS.TIME_SELECT} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workingHours.to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Время закрытия</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className={FORM_WIDTHS.TIME_SELECT} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить изменения
            </Button>
          </div>
        </form>
      </Form>

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Зоны доставки
              </CardTitle>
              <CardDescription>
                Настройка зон и стоимости доставки
              </CardDescription>
            </div>
            <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingZone(null)
                    setZoneForm({ name: "", price: 0 })
                  }}
                  className={BUTTON_CLASSES.FULL_MOBILE}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить зону
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? "Редактировать зону" : "Новая зона доставки"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingZone 
                      ? "Измените параметры зоны доставки" 
                      : "Добавьте новую зону доставки"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="zone-name">Название зоны</Label>
                    <Input
                      id="zone-name"
                      value={zoneForm.name}
                      onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                      placeholder="Например: Центр города"
                      className={FORM_WIDTHS.SHORT_TEXT}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zone-price">Стоимость доставки</Label>
                    <Input
                      id="zone-price"
                      type="number"
                      value={zoneForm.price}
                      onChange={(e) => setZoneForm({ ...zoneForm, price: parseInt(e.target.value) || 0 })}
                      placeholder="2000"
                      className={FORM_WIDTHS.CURRENCY}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsZoneDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleAddZone} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {editingZone ? "Сохранить" : "Добавить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Зона доставки</TableHead>
                <TableHead>Стоимость</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(settings?.deliveryZones || []).map((zone) => (
                <TableRow key={zone.name}>
                  <TableCell>{zone.name}</TableCell>
                  <TableCell>{formatCurrency(zone.price)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditZone(zone)}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteZone(zone.name)}
                        disabled={updateMutation.isPending}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Изменения в настройках применяются сразу после сохранения и влияют на все новые заказы.
        </AlertDescription>
      </Alert>
      </div>
    </FormShell>
  )
}