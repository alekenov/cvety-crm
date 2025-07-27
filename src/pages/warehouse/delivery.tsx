import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { SUPPLIERS, FARMS, VARIETIES, HEIGHTS, CURRENCIES, DEFAULT_CURRENCY, DEFAULT_MARKUP_PERCENT } from "@/lib/constants"

const deliverySchema = z.object({
  supplier: z.string().min(1, "Выберите поставщика"),
  farm: z.string().min(1, "Выберите ферму"),
  deliveryDate: z.date({
    required_error: "Выберите дату поставки",
  }),
  currency: z.string().min(1, "Выберите валюту"),
  rate: z.number().min(0.01, "Укажите курс"),
  comment: z.string().optional(),
  positions: z.array(
    z.object({
      variety: z.string().min(1, "Выберите сорт"),
      heightCm: z.number().min(1, "Выберите высоту"),
      qty: z.number().min(1, "Укажите количество"),
      costPerStem: z.number().min(0.01, "Укажите цену за штуку"),
    })
  ).min(1, "Добавьте хотя бы одну позицию"),
})

type DeliveryFormValues = z.infer<typeof deliverySchema>

export function DeliveryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      supplier: "",
      farm: "",
      deliveryDate: new Date(),
      currency: DEFAULT_CURRENCY,
      rate: 1,
      comment: "",
      positions: [
        {
          variety: "",
          heightCm: 0,
          qty: 0,
          costPerStem: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "positions",
  })

  const watchPositions = form.watch("positions")
  const watchCurrency = form.watch("currency")
  const watchRate = form.watch("rate")

  const calculateCostTotal = () => {
    return watchPositions.reduce((total, position) => {
      return total + (position.qty * position.costPerStem * watchRate)
    }, 0)
  }

  const calculateRecommendedPrice = (costPerStem: number) => {
    const costInKzt = costPerStem * watchRate
    return Math.round(costInKzt * (1 + DEFAULT_MARKUP_PERCENT / 100))
  }

  const onSubmit = async (values: DeliveryFormValues) => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success("Поставка успешно оформлена")
    form.reset()
    setIsSubmitting(false)
    setShowConfirmDialog(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Приёмка поставки</h1>
        <p className="text-muted-foreground mt-2">
          Оформление новой поставки цветов на склад
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Fields */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Поставщик</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите поставщика" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPLIERS.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="farm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ферма</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ферму" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FARMS.map((farm) => (
                        <SelectItem key={farm} value={farm}>
                          {farm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата поставки</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd.MM.yyyy")
                          ) : (
                            <span>Выберите дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Курс к KZT</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    1 {watchCurrency} = {field.value} KZT
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Positions Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Позиции</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  variety: "",
                  heightCm: 0,
                  qty: 0,
                  costPerStem: 0,
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить позицию
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сорт</TableHead>
                    <TableHead>Высота</TableHead>
                    <TableHead>Количество</TableHead>
                    <TableHead>Цена за шт ({watchCurrency})</TableHead>
                    <TableHead>Сумма (KZT)</TableHead>
                    <TableHead>Рек. цена</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`positions.${index}.variety`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {VARIETIES.map((variety) => (
                                    <SelectItem key={variety} value={variety}>
                                      {variety}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`positions.${index}.heightCm`}
                          render={({ field }) => (
                            <FormItem>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="см" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {HEIGHTS.map((height) => (
                                    <SelectItem key={height} value={height.toString()}>
                                      {height} см
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`positions.${index}.qty`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`positions.${index}.costPerStem`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          watchPositions[index]?.qty * 
                          watchPositions[index]?.costPerStem * 
                          watchRate || 0
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          calculateRecommendedPrice(watchPositions[index]?.costPerStem || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Итоги</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Общая стоимость:</span>
                  <span className="font-medium">
                    {formatCurrency(calculateCostTotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Количество позиций:</span>
                  <span>{fields.length}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Общее количество:</span>
                  <span>
                    {watchPositions.reduce((sum, pos) => sum + (pos.qty || 0), 0)} шт
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogTrigger asChild>
                <Button type="submit" size="lg">
                  Оформить поставку
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Подтверждение поставки</DialogTitle>
                  <DialogDescription>
                    Вы уверены, что хотите оформить эту поставку? 
                    Позиции будут добавлены на склад.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm">
                    Общая стоимость: <strong>{formatCurrency(calculateCostTotal())}</strong>
                  </p>
                  <p className="text-sm">
                    Количество позиций: <strong>{fields.length}</strong>
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Оформление..." : "Подтвердить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </div>
  )
}