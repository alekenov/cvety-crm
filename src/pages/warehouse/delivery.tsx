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
import { FlowerAutocomplete } from "@/components/flower-autocomplete"

import { cn } from "@/lib/utils"
import { SUPPLIERS, FARMS, VARIETIES, HEIGHTS, CURRENCIES, DEFAULT_CURRENCY, DEFAULT_MARKUP_PERCENT } from "@/lib/constants"

const deliverySchema = z.object({
  deliveryDate: z.date({
    required_error: "Выберите дату поставки",
  }),
  comment: z.string().optional(),
  positions: z.array(
    z.object({
      flower: z.string().min(1, "Выберите цветок"),
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
      deliveryDate: new Date(),
      comment: "",
      positions: [
        {
          flower: "",
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

  const calculateCostTotal = () => {
    return watchPositions.reduce((total, position) => {
      return total + (position.qty * position.costPerStem)
    }, 0)
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
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Приёмка поставки</h1>
        <p className="text-muted-foreground mt-2">
          Оформление новой поставки цветов на склад
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Fields */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
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
            </CardContent>
          </Card>

          {/* Positions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Позиции</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    flower: "",
                    qty: 0,
                    costPerStem: 0,
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить позицию
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead className="w-[120px]">Количество</TableHead>
                      <TableHead className="w-[150px]">Цена за шт (₸)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`positions.${index}.flower`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <FlowerAutocomplete
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Выберите или введите..."
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
                          name={`positions.${index}.qty`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-[100px] text-right"
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
                                  className="w-[120px] text-right"
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
          </CardContent>
        </Card>

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