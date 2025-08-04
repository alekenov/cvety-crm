import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Phone, Calendar, Clock, CreditCard, Star } from 'lucide-react';
import { ReviewDialog } from '@/components/ReviewDialog';

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
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Загрузка информации о заказе...</h2>
          <p className="text-gray-600">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Заказ не найден</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Проверьте правильность ссылки для отслеживания или обратитесь в службу поддержки.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Отслеживание заказа
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Актуальная информация о статусе вашего заказа
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {trackingInfo && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Order Status */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">#{trackingInfo.order_number}</h3>
                    <p className="text-blue-100">Номер заказа</p>
                  </div>
                  <Badge className={`${statusColors[trackingInfo.status as keyof typeof statusColors]} text-xs font-semibold px-3 py-1`}>
                    {statusNames[trackingInfo.status as keyof typeof statusNames]}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Создан</p>
                      <p className="font-semibold text-gray-900">{formatDate(trackingInfo.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Обновлен</p>
                      <p className="font-semibold text-gray-900">{formatDate(trackingInfo.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  Информация о доставке
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Способ получения</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="font-semibold text-gray-900">
                          {deliveryMethodNames[trackingInfo.delivery_method as keyof typeof deliveryMethodNames]}
                        </p>
                      </div>
                    </div>
                    
                    {trackingInfo.recipient_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Получатель</p>
                        <p className="font-semibold text-gray-900">{trackingInfo.recipient_name}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {trackingInfo.recipient_phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Телефон</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="h-3 w-3 text-green-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{trackingInfo.recipient_phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {trackingInfo.delivery_window && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Время доставки</p>
                        <p className="font-semibold text-gray-900">
                          {trackingInfo.delivery_window.from_time && trackingInfo.delivery_window.to_time
                            ? `${formatDate(trackingInfo.delivery_window.from_time)} - ${formatDate(trackingInfo.delivery_window.to_time)}`
                            : 'Время уточняется'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {trackingInfo.address && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Адрес доставки</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-900">{trackingInfo.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  Состав заказа
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {trackingInfo.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Количество: {item.quantity} шт.</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-sm text-gray-500">{formatPrice(item.price)} за шт.</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Стоимость товаров:</span>
                        <span className="font-semibold">{formatPrice(trackingInfo.total - trackingInfo.delivery_fee)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Доставка:</span>
                        <span className="font-semibold">
                          {trackingInfo.delivery_fee > 0 ? formatPrice(trackingInfo.delivery_fee) : 'Бесплатно'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                        <span className="text-xl font-bold text-gray-900">Итого к оплате:</span>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="text-2xl font-bold text-blue-600">{formatPrice(trackingInfo.total)}</span>
                        </div>
                      </div>
                    </div>
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

        {/* Review Dialog */}
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          orderNumber={trackingInfo?.order_number}
          productName={trackingInfo?.items?.[0]?.product_name}
          onSubmit={handleReviewSubmit}
        />
      </div>
    </div>
  );
}