import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Using public status API directly instead of trackingApi

export function OrderSuccessPage() {
  const { shopId, token } = useParams<{ shopId: string; token: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/status/${token}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Не удалось загрузить информацию о заказе');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      assembled: 'bg-yellow-100 text-yellow-800',
      delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'Новый',
      paid: 'Оплачен',
      assembled: 'Собран',
      delivery: 'В доставке',
      delivered: 'Доставлен',
      cancelled: 'Отменен',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
            <p className="text-gray-600 mb-4">{error || 'Заказ не найден'}</p>
            <Button onClick={() => navigate(`/shop/${shopId}`)}>
              Вернуться в магазин
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/shop/${shopId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в магазин
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            Заказ успешно оформлен!
          </h1>
          <p className="text-green-700 mb-4">
            Номер вашего заказа: <span className="font-mono font-bold">#{order.order_number}</span>
          </p>
          <p className="text-gray-600 mb-4">
            Мы отправили детали заказа на ваш телефон
          </p>
          <div className="bg-white rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 mb-2">Ссылка для отслеживания:</p>
            <Link 
              to={`/status/${token}`}
              className="text-blue-600 hover:underline break-all"
            >
              {window.location.origin}/status/{token}
            </Link>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Info */}
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
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Дата оформления:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Способ доставки:</span>
                <span>{order.delivery_method === 'delivery' ? 'Доставка' : 'Самовывоз'}</span>
              </div>
              {order.delivery_window && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Время доставки:</span>
                  <span>
                    {formatTime(order.delivery_window.from)} - {formatTime(order.delivery_window.to)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.recipient_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Получатель:</span>
                  <span>{order.recipient_name}</span>
                </div>
              )}
              {order.recipient_phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Телефон:</span>
                  <span>{order.recipient_phone}</span>
                </div>
              )}
              {order.address && (
                <div>
                  <span className="text-gray-600 flex items-center gap-1 mb-1">
                    <MapPin className="h-4 w-4" />
                    Адрес доставки:
                  </span>
                  <p className="text-sm">{order.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Состав заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
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
                <span>{formatPrice(order.total - (order.delivery_fee || 0))}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Доставка:</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Итого:</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => navigate(`/shop/${shopId}`)}
          >
            Продолжить покупки
          </Button>
          <Button 
            onClick={() => navigate(`/status/${token}`)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Отследить заказ
          </Button>
        </div>
      </main>
    </div>
  );
}