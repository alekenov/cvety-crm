import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Phone, Calendar, Clock, CreditCard, Star, CheckCircle, ArrowLeft, ShoppingCart, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { ReviewDialog } from '@/components/ReviewDialog';
import { toast } from 'sonner';

interface TrackingInfo {
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_method: string;
  delivery_window?: {
    from_time?: string;
    to_time?: string;
  };
  delivery_fee: number;
  total: number;
  recipient_name?: string;
  recipient_phone?: string;
  address?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
  tracking_token: string;
}

const statusNames = {
  new: 'Новый',
  paid: 'Оплачен',
  assembled: 'Собран',
  delivery: 'В доставке',
  self_pickup: 'Готов к самовывозу',
  completed: 'Выполнен',
  cancelled: 'Отменен',
  issue: 'Проблема'
};

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  paid: 'bg-blue-100 text-blue-800',
  assembled: 'bg-yellow-100 text-yellow-800',
  delivery: 'bg-purple-100 text-purple-800',
  self_pickup: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  issue: 'bg-red-100 text-red-800'
};

const deliveryMethodNames = {
  delivery: 'Доставка',
  self_pickup: 'Самовывоз'
};

export function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);

  // Загружаем информацию о заказе при загрузке страницы
  useEffect(() => {
    const loadTrackingInfo = async () => {
      if (!token) {
        setError('Неверная ссылка для отслеживания');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public/status/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Заказ не найден или ссылка недействительна');
          }
          throw new Error('Ошибка при получении информации о заказе');
        }

        const data = await response.json();
        setTrackingInfo(data);
        
        // Check if order is new (created within last 5 minutes)
        const orderCreatedAt = new Date(data.created_at);
        const now = new Date();
        const diffInMinutes = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60);
        setIsNewOrder(diffInMinutes <= 5);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
        setTrackingInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrackingInfo();
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ₸`;
  };

  const handleReviewSubmit = (reviewData: any) => {
    console.log('Review submitted:', reviewData);
    setHasReviewed(true);
    // Here you would typically send the review to your API
  };

  const canLeaveReview = trackingInfo && 
    (trackingInfo.status === 'completed' || trackingInfo.status === 'delivery') && 
    !hasReviewed;

  const handleCopyTrackingLink = () => {
    const trackingUrl = `${window.location.origin}/status/${token}`;
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Ссылка для отслеживания скопирована');
  };

  const handleReturnToShop = () => {
    // Extract shop ID from URL or use default
    navigate('/shop/1');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trackingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
            <p className="text-gray-600 mb-4">{error || 'Заказ не найден'}</p>
            <Button onClick={handleReturnToShop}>
              Вернуться в магазин
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with context-aware success message */}
      {isNewOrder ? (
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              onClick={handleReturnToShop}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться в магазин
            </Button>
          </div>
        </header>
      ) : (
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Отслеживание заказа
              </h1>
              <p className="text-gray-600">
                Номер заказа: <span className="font-mono font-bold">{trackingInfo.order_number}</span>
              </p>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message for New Orders */}
        {isNewOrder && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-900 mb-2">
              Заказ успешно оформлен!
            </h1>
            <p className="text-green-700 mb-4">
              Номер вашего заказа: <span className="font-mono font-bold">{trackingInfo.order_number}</span>
            </p>
            <p className="text-gray-600 mb-4">
              Мы отправили детали заказа на ваш телефон
            </p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-2">Ссылка для отслеживания:</p>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 break-all">
                  {window.location.origin}/status/{token}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyTrackingLink}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {trackingInfo && (
          <div className="space-y-6">
            {/* Order Status - Improved design with grid layout */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Order Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Информация о заказе
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Статус:</span>
                    <Badge className={statusColors[trackingInfo.status as keyof typeof statusColors]}>
                      {statusNames[trackingInfo.status as keyof typeof statusNames]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дата оформления:</span>
                    <span>{formatDate(trackingInfo.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Способ доставки:</span>
                    <span>{deliveryMethodNames[trackingInfo.delivery_method as keyof typeof deliveryMethodNames]}</span>
                  </div>
                  {trackingInfo.delivery_window && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Время доставки:</span>
                      <span>
                        {formatDate(trackingInfo.delivery_window.from_time || '')} - 
                        {formatDate(trackingInfo.delivery_window.to_time || '')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Контактная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackingInfo.recipient_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Получатель:</span>
                      <span>{trackingInfo.recipient_name}</span>
                    </div>
                  )}
                  {trackingInfo.recipient_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Телефон:</span>
                      <span>{trackingInfo.recipient_phone}</span>
                    </div>
                  )}
                  {trackingInfo.address && (
                    <div>
                      <span className="text-gray-600 flex items-center gap-1 mb-1">
                        <MapPin className="h-4 w-4" />
                        Адрес доставки:
                      </span>
                      <p className="text-sm">{trackingInfo.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>


            {/* Order Items - Improved Card Design */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Состав заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingInfo.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatPrice(item.quantity * item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Товары:</span>
                    <span>{formatPrice(trackingInfo.total - trackingInfo.delivery_fee)}</span>
                  </div>
                  {trackingInfo.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Доставка:</span>
                      <span>{formatPrice(trackingInfo.delivery_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span className="text-primary">{formatPrice(trackingInfo.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Section */}
            {canLeaveReview && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    Оценить заказ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      Как вам заказ? Ваше мнение поможет нам стать лучше!
                    </p>
                    <Button 
                      onClick={() => setShowReviewDialog(true)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Оставить отзыв
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasReviewed && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-green-600 fill-current" />
                  </div>
                  <p className="text-green-800 font-medium">
                    Спасибо за ваш отзыв! 
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Ваше мнение очень важно для нас
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={handleReturnToShop}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Продолжить покупки
          </Button>
          <Button 
            onClick={handleCopyTrackingLink}
          >
            <Copy className="mr-2 h-4 w-4" />
            Скопировать ссылку
          </Button>
        </div>

        {/* Review Dialog */}
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          orderNumber={trackingInfo?.order_number}
          productName={trackingInfo?.items?.[0]?.product_name}
          onSubmit={handleReviewSubmit}
        />
      </main>
    </div>
  );
}