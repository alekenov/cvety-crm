import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, MapPin, Phone, Calendar, Clock, CreditCard, Star, CheckCircle, ArrowLeft, ShoppingCart, ExternalLink, Copy, Loader2, Edit3, MessageCircle, Camera, ThumbsUp, ThumbsDown, Send, User } from 'lucide-react';
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

interface Comment {
  id: number;
  text: string;
  author_type: 'staff' | 'customer';
  author_name: string;
  created_at: string;
}

interface OrderPhoto {
  id: number;
  photo_url: string;
  photo_type: 'pre_delivery' | 'completion' | 'process';
  description?: string;
  customer_feedback?: 'like' | 'dislike';
  feedback_comment?: string;
  created_at: string;
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

  // Customer interaction features
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');

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

        // Initialize address edit form
        setNewAddress(data.address || '');
        setNewRecipientName(data.recipient_name || '');
        setNewRecipientPhone(data.recipient_phone || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
        setTrackingInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrackingInfo();
  }, [token]);

  // Load comments and photos
  useEffect(() => {
    if (!token) return;

    const loadCommentsAndPhotos = async () => {
      try {
        // Load comments
        const commentsResponse = await fetch(`/api/public/orders/${token}/comments`);
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData.items || []);
        }

        // Load photos
        const photosResponse = await fetch(`/api/public/orders/${token}/photos`);
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(photosData.items || []);
        }
      } catch (err) {
        console.error('Error loading comments and photos:', err);
      }
    };

    loadCommentsAndPhotos();
  }, [token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('ru-RU');
    } catch {
      return '';
    }
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
    const shopId = localStorage.getItem('shopId') || '1';
    navigate(`/shop/${shopId}`);
  };

  // Address editing functions
  const canEditAddress = trackingInfo && (trackingInfo.status === 'new' || trackingInfo.status === 'paid');

  const handleUpdateAddress = async () => {
    if (!token || !newAddress.trim()) return;

    try {
      const response = await fetch(`/api/public/orders/${token}/address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newAddress,
          recipient_name: newRecipientName,
          recipient_phone: newRecipientPhone,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setEditingAddress(false);
        
        // Update tracking info
        if (trackingInfo) {
          setTrackingInfo({
            ...trackingInfo,
            address: newAddress,
            recipient_name: newRecipientName,
            recipient_phone: newRecipientPhone,
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка при обновлении адреса');
      }
    } catch (err) {
      toast.error('Ошибка при обновлении адреса');
    }
  };

  // Comment functions
  const handleAddComment = async () => {
    if (!token || !newComment.trim() || !customerName.trim()) return;

    try {
      const response = await fetch(`/api/public/orders/${token}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment,
          customer_name: customerName,
        }),
      });

      if (response.ok) {
        toast.success('Комментарий добавлен');
        setNewComment('');
        
        // Reload comments
        const commentsResponse = await fetch(`/api/public/orders/${token}/comments`);
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData.items || []);
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка при добавлении комментария');
      }
    } catch (err) {
      toast.error('Ошибка при добавлении комментария');
    }
  };

  // Photo feedback functions
  const handlePhotoFeedback = async (photoId: number, feedback: 'like' | 'dislike', comment?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/public/orders/${token}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo_id: photoId,
          feedback,
          comment,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        
        // Update photos state
        setPhotos(photos.map(photo => 
          photo.id === photoId 
            ? { ...photo, customer_feedback: feedback, feedback_comment: comment }
            : photo
        ));
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка при отправке отзыва');
      }
    } catch (err) {
      toast.error('Ошибка при отправке отзыва');
    }
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
                  {trackingInfo.delivery_window && trackingInfo.delivery_window.from_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Время доставки:</span>
                      <span>
                        {formatDate(trackingInfo.delivery_window.from_time)} - 
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
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Адрес доставки:
                        </span>
                        {canEditAddress && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAddress(true)}
                            className="h-6 px-2"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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

            {/* Address Edit Dialog */}
            <Dialog open={editingAddress} onOpenChange={setEditingAddress}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Изменить адрес доставки</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Адрес доставки</label>
                    <Textarea
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Введите новый адрес"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Имя получателя</label>
                    <Input
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      placeholder="Имя получателя"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Телефон получателя</label>
                    <Input
                      value={newRecipientPhone}
                      onChange={(e) => setNewRecipientPhone(e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingAddress(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleUpdateAddress}>
                      Сохранить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Photos Section */}
            {photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Фото букета
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="space-y-3">
                        <div className="relative">
                          <img
                            src={photo.photo_url}
                            alt={photo.description || "Фото букета"}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Badge className="absolute top-2 left-2 bg-white/90 text-gray-700">
                            {photo.photo_type === 'pre_delivery' && 'Перед доставкой'}
                            {photo.photo_type === 'completion' && 'Готово'}
                            {photo.photo_type === 'process' && 'В работе'}
                          </Badge>
                        </div>
                        
                        {photo.description && (
                          <p className="text-sm text-gray-600">{photo.description}</p>
                        )}

                        {photo.customer_feedback ? (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {photo.customer_feedback === 'like' ? (
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {photo.customer_feedback === 'like' ? 'Вам понравилось' : 'Вам не понравилось'}
                            </span>
                            {photo.feedback_comment && (
                              <span className="text-sm text-gray-600">: {photo.feedback_comment}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePhotoFeedback(photo.id, 'like')}
                              className="flex-1"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Нравится
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePhotoFeedback(photo.id, 'dislike')}
                              className="flex-1"
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Не нравится
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Комментарии
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Existing Comments */}
                {comments.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {comment.author_type === 'staff' ? (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.author_name}</span>
                            {comment.author_type === 'staff' && (
                              <Badge variant="secondary" className="text-xs">Сотрудник</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Добавить комментарий</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Ваше имя"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <div></div>
                  </div>
                  <Textarea
                    placeholder="Ваш комментарий"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || !customerName.trim()}
                    className="w-full md:w-auto"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Отправить комментарий
                  </Button>
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