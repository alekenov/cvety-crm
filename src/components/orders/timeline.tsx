import { CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeDate } from "@/lib/date-utils"

export interface TimelineEvent {
  id: string
  status: string
  timestamp: Date
  user: string
  comment: string
  type?: 'success' | 'warning' | 'default'
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        const Icon = event.type === 'success' 
          ? CheckCircle2 
          : event.type === 'warning' 
          ? AlertCircle 
          : Circle

        return (
          <div key={event.id} className="flex gap-4 pb-8 last:pb-0">
            {/* Icon and line */}
            <div className="relative flex flex-col items-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background",
                event.type === 'success' && "border-green-500 text-green-500",
                event.type === 'warning' && "border-yellow-500 text-yellow-500",
                !event.type && "border-muted-foreground text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && (
                <div className="absolute top-10 h-full w-0.5 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{event.user}</span>
                <span className="text-muted-foreground">•</span>
                <time className="text-muted-foreground">
                  {formatRelativeDate(event.timestamp)}
                </time>
              </div>
              <p className="mt-1 text-sm text-foreground">{event.comment}</p>
              {event.status && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {event.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}