import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { format } from "date-fns"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MapPin,
  Phone,
  Image as ImageIcon,
  X
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

import type { TrackingData, OrderStatus } from "@/lib/types"
import { ORDER_STATUS_LABELS, DATETIME_FORMAT } from "@/lib/constants"

// Mock tracking data
const mockTrackingData: Record<string, TrackingData> = {
  "test-token": {
    status: "delivery",
    updatedAt: new Date("2024-01-26T14:30:00"),
    photos: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300",
      "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=300",
      "https://images.unsplash.com/photo-1582794543462-0d7922e50cf5?w=300",
    ],
    deliveryWindow: {
      from: new Date("2024-01-26T14:00:00"),
      to: new Date("2024-01-26T16:00:00")
    },
    deliveryMethod: "delivery",
    address: "ул. Абая 150, кв **",
    trackingToken: "test-token",
    viewsCount: 5
  }
}

const statusIcons: Record<OrderStatus, React.ElementType> = {
  new: Clock,
  paid: CheckCircle,
  assembled: Package,
  delivery: Truck,
  self_pickup: MapPin,
  issue: AlertCircle,
}

const statusColors: Record<OrderStatus, string> = {
  new: "text-gray-500",
  paid: "text-blue-500",
  assembled: "text-purple-500",
  delivery: "text-orange-500",
  self_pickup: "text-green-500",
  issue: "text-destructive",
}

export function TrackingPage() {
  const { token } = useParams<{ token: string }>()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const data = mockTrackingData[token || ""]
        if (data) {
          setTrackingData(data)
          // Increment view count
          data.viewsCount = (data.viewsCount || 0) + 1
        } else {
          setError("Заказ не найден")
        }
      } catch (err) {
        setError("Ошибка загрузки данных")
        toast.error("Не удалось загрузить информацию о заказе")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchTrackingData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">{error || "Заказ не найден"}</h2>
              <p className="text-sm text-muted-foreground">
                Проверьте правильность ссылки или обратитесь в службу поддержки
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusIcons[trackingData.status]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Logo/Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold">Cvety.kz</h1>
          <p className="text-muted-foreground mt-2">Отслеживание заказа</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-8 w-8 ${statusColors[trackingData.status]}`} />
                <div>
                  <CardTitle>{ORDER_STATUS_LABELS[trackingData.status]}</CardTitle>
                  <CardDescription>
                    Обновлено: {format(trackingData.updatedAt, DATETIME_FORMAT)}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={trackingData.status === 'issue' ? 'destructive' : 'secondary'}>
                {trackingData.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Photos */}
        {trackingData.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Фотографии букета
              </CardTitle>
              <CardDescription>
                Фотографии сделаны перед отправкой
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {trackingData.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-transform hover:scale-105"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        className="h-32 w-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о доставке</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Время доставки</p>
                <p className="text-sm text-muted-foreground">
                  {format(trackingData.deliveryWindow.from, "dd.MM.yyyy")} с{" "}
                  {format(trackingData.deliveryWindow.from, "HH:mm")} до{" "}
                  {format(trackingData.deliveryWindow.to, "HH:mm")}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              {trackingData.deliveryMethod === 'delivery' ? (
                <>
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Адрес доставки</p>
                    <p className="text-sm text-muted-foreground">{trackingData.address}</p>
                  </div>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Самовывоз</p>
                    <p className="text-sm text-muted-foreground">
                      Заказ будет готов к указанному времени
                    </p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Контакты</p>
                <p className="text-sm text-muted-foreground">
                  При доставке курьер свяжется с получателем
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>По всем вопросам обращайтесь:</p>
          <p className="font-medium">+7 (700) 123-45-67</p>
          {trackingData.viewsCount && (
            <p className="mt-4 text-xs">
              Эту страницу просмотрели {trackingData.viewsCount} раз
            </p>
          )}
        </div>
      </div>

      {/* Photo Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Фотография букета</DialogTitle>
          <DialogDescription className="sr-only">
            Увеличенное изображение букета
          </DialogDescription>
          <div className="relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Фото букета"
                className="w-full rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}