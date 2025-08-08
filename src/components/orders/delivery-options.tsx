import { useState } from "react"
import { format, addDays } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon, Clock, MapPin, Truck, Store } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// Select components removed - not used in this file
import type { DeliveryMethod } from "@/lib/types"
import { FORM_WIDTHS } from "@/lib/constants"

interface DeliveryInfo {
  method: DeliveryMethod
  date?: Date
  timeFrom?: string
  timeTo?: string
  address?: string
  recipientName?: string
  recipientPhone?: string
  comment?: string
}

interface DeliveryOptionsProps {
  deliveryInfo: DeliveryInfo
  onUpdateDelivery: (info: DeliveryInfo) => void
}

const timeSlots = [
  { from: "09:00", to: "11:00" },
  { from: "11:00", to: "13:00" },
  { from: "13:00", to: "15:00" },
  { from: "15:00", to: "17:00" },
  { from: "17:00", to: "19:00" },
  { from: "19:00", to: "21:00" },
]

export function DeliveryOptions({ deliveryInfo, onUpdateDelivery }: DeliveryOptionsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(deliveryInfo.date)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    onUpdateDelivery({ ...deliveryInfo, date })
  }

  const handleTimeSlotSelect = (slot: string) => {
    const [timeFrom, timeTo] = slot.split('-')
    setSelectedTimeSlot(slot)
    onUpdateDelivery({ ...deliveryInfo, timeFrom, timeTo })
  }

  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()

  const availableTimeSlots = timeSlots.filter(slot => {
    if (!isToday) return true
    const slotHour = parseInt(slot.from.split(':')[0])
    return slotHour > currentHour + 2 // Минимум 2 часа на подготовку
  })

  return (
    <div className="space-y-6">
      {/* Delivery method */}
      <div className="space-y-3">
        <Label>Способ доставки</Label>
        <RadioGroup
          value={deliveryInfo.method}
          onValueChange={(value: DeliveryMethod) => 
            onUpdateDelivery({ ...deliveryInfo, method: value })
          }
        >
          <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent">
            <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4" />
                <span className="font-medium">Доставка курьером</span>
              </div>
              <p className="text-sm text-muted-foreground">
                По городу - 1500-2000 ₸, за город - от 3000 ₸
              </p>
            </Label>
          </div>
          <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent">
            <RadioGroupItem value="self_pickup" id="self_pickup" className="mt-1" />
            <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4" />
                <span className="font-medium">Самовывоз</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ул. Абая 150, ежедневно с 9:00 до 21:00
              </p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Date selection */}
      <div className="space-y-3">
        <Label>Дата доставки</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full max-w-xs justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "d MMMM yyyy", { locale: ru })
              ) : (
                <span>Выберите дату</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 14)}
              locale={ru}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time selection */}
      {selectedDate && (
        <div className="space-y-3">
          <Label>Время доставки</Label>
          <div className="grid grid-cols-2 gap-2 max-w-lg">
            {availableTimeSlots.map((slot) => (
              <Button
                key={`${slot.from}-${slot.to}`}
                variant={selectedTimeSlot === `${slot.from}-${slot.to}` ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleTimeSlotSelect(`${slot.from}-${slot.to}`)}
              >
                <Clock className="mr-2 h-4 w-4" />
                {slot.from} - {slot.to}
              </Button>
            ))}
          </div>
          {availableTimeSlots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              На сегодня доставка недоступна. Выберите другую дату.
            </p>
          )}
        </div>
      )}

      {/* Delivery details */}
      {deliveryInfo.method === 'delivery' && (
        <>
          <div className="space-y-3">
            <Label htmlFor="address">Адрес доставки</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                placeholder="Улица, дом, квартира..."
                value={deliveryInfo.address || ''}
                onChange={(e) => onUpdateDelivery({ ...deliveryInfo, address: e.target.value })}
                className={`pl-8 min-h-[80px] ${FORM_WIDTHS.ADDRESS}`}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Имя получателя</Label>
              <Input
                id="recipientName"
                placeholder="Как зовут получателя"
                value={deliveryInfo.recipientName || ''}
                onChange={(e) => onUpdateDelivery({ ...deliveryInfo, recipientName: e.target.value })}
                className={FORM_WIDTHS.NAME}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Телефон получателя</Label>
              <Input
                id="recipientPhone"
                placeholder="+7 (___) ___-__-__"
                value={deliveryInfo.recipientPhone || ''}
                onChange={(e) => onUpdateDelivery({ ...deliveryInfo, recipientPhone: e.target.value })}
                className={FORM_WIDTHS.PHONE}
              />
            </div>
          </div>
        </>
      )}

      {/* Comment */}
      <div className="space-y-3">
        <Label htmlFor="comment">Комментарий к заказу</Label>
        <Textarea
          id="comment"
          placeholder="Дополнительная информация..."
          value={deliveryInfo.comment || ''}
          onChange={(e) => onUpdateDelivery({ ...deliveryInfo, comment: e.target.value })}
          className={`min-h-[80px] ${FORM_WIDTHS.COMMENT}`}
        />
      </div>
    </div>
  )
}