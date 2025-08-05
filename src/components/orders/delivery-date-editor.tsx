import { useState } from "react"
import { Calendar, Clock, Check, X } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FORM_WIDTHS } from "@/lib/constants"

interface DeliveryDateEditorProps {
  deliveryWindow: {
    from: string | Date
    to: string | Date
  } | null
  onSave: (deliveryWindow: { from: string; to: string }) => void
  onCancel: () => void
}

export function DeliveryDateEditor({ deliveryWindow, onSave, onCancel }: DeliveryDateEditorProps) {
  const initialDate = deliveryWindow ? new Date(deliveryWindow.from) : new Date()
  const initialFromTime = deliveryWindow 
    ? format(new Date(deliveryWindow.from), "HH:mm")
    : "10:00"
  const initialToTime = deliveryWindow 
    ? format(new Date(deliveryWindow.to), "HH:mm")
    : "12:00"

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [fromTime, setFromTime] = useState(initialFromTime)
  const [toTime, setToTime] = useState(initialToTime)

  // Generate time options (every 30 minutes)
  const timeOptions = []
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(time)
    }
  }

  const handleSave = () => {
    const [fromHour, fromMinute] = fromTime.split(':').map(Number)
    const [toHour, toMinute] = toTime.split(':').map(Number)
    
    const fromDate = new Date(selectedDate)
    fromDate.setHours(fromHour, fromMinute, 0, 0)
    
    const toDate = new Date(selectedDate)
    toDate.setHours(toHour, toMinute, 0, 0)
    
    onSave({
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50 max-w-2xl">
      {/* Stack vertically on mobile, side by side on desktop */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Дата доставки</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${FORM_WIDTHS.DATE_PICKER}`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, "d MMMM yyyy", { locale: ru })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Время доставки</label>
          <div className="flex items-center gap-2">
            <Select value={fromTime} onValueChange={setFromTime}>
              <SelectTrigger className={`w-full ${FORM_WIDTHS.TIME_SELECT}`}>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground px-1">–</span>
            <Select value={toTime} onValueChange={setToTime}>
              <SelectTrigger className={`w-full ${FORM_WIDTHS.TIME_SELECT}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeOptions
                  .filter((time) => time > fromTime)
                  .map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleSave}
          className="flex-1 sm:flex-initial"
        >
          <Check className="mr-1 h-4 w-4" />
          Сохранить
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 sm:flex-initial"
        >
          <X className="mr-1 h-4 w-4" />
          Отмена
        </Button>
      </div>
    </div>
  )
}