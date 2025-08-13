import { useState, useEffect } from "react";
import { Product, CartItem } from "../types";
import { Heart, Star, Plus, Share2, ChevronLeft, ChevronRight, ArrowLeft, Gift, Truck, Droplets, Clock, ShoppingCart } from "lucide-react";

interface ProductPageProps {
  product: Product | null;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onProceedToCheckout: () => void;
  cartItems: CartItem[];
}

// Размеры букетов с ценами
const bouquetSizes = [
  { 
    id: 'mini', 
    name: 'Мини', 
    description: '15-20 цветов',
    priceMultiplier: 0.7,
    isPopular: false
  },
  { 
    id: 'standard', 
    name: 'Стандарт', 
    description: '25-30 цветов',
    priceMultiplier: 1,
    isPopular: false
  },
  { 
    id: 'premium', 
    name: 'Премиум', 
    description: '35-40 цветов',
    priceMultiplier: 1.4,
    isPopular: true
  },
  { 
    id: 'deluxe', 
    name: 'Делюкс', 
    description: '45-50 цветов',
    priceMultiplier: 1.8,
    isPopular: false
  },
  { 
    id: 'vip', 
    name: 'VIP', 
    description: '55-60+ цветов',
    priceMultiplier: 2.5,
    isPopular: false
  }
];

// Моковые отзывы с фото букетов
const mockReviews = [
  {
    id: 1,
    author: "Айгуль К.",
    rating: 5,
    date: "10 августа 2025",
    text: "Потрясающий букет! Цветы свежие, доставили точно в срок. Получательница была в восторге! Флорист собрал именно то, что я хотела - яркие красные розы с нежной гипсофилой.",
    helpful: 12,
    verified: true,
    bouquetPhoto: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop&crop=center"
  },
  {
    id: 2,
    author: "Дмитрий С.",
    rating: 5,
    date: "8 августа 2025", 
    text: "Заказывал жене на годовщину. Букет превзошел все ожидания, очень качественно упакован. Размер Премиум был идеальным - не слишком большой, но очень эффектный.",
    helpful: 8,
    verified: true,
    bouquetPhoto: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop&crop=center"
  },
  {
    id: 3,
    author: "Мария Л.",
    rating: 4,
    date: "5 августа 2025",
    text: "Красивые цветы, но немного меньше ожидаемого размера. В целом довольна покупкой. Упаковка стильная, розы свежие. Заказывала размер Стандарт.",
    helpful: 3,
    verified: false,
    bouquetPhoto: "https://images.unsplash.com/photo-1573376670774-4427757f7963?w=400&h=400&fit=crop&crop=center"
  },
  {
    id: 4,
    author: "Алексей П.",
    rating: 5,
    date: "2 августа 2025",
    text: "Великолепная работа! Заказывал VIP букет на день рождения мамы. Количество цветов просто поражает, а качество на высшем уровне. Доставка была быстрой.",
    helpful: 15,
    verified: true,
    bouquetPhoto: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"
  }
];

export function ProductPage({ product, onBack, onAddToCart, onProceedToCheckout, cartItems }: ProductPageProps) {
  const [selectedSize, setSelectedSize] = useState(bouquetSizes[2].id); // Default to Premium
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'composition' | 'reviews'>('reviews'); // Default to reviews
  const [isFavorite, setIsFavorite] = useState(false);

  // Моковые изображения - в реальном приложении это будет из product.images
  const images = [
    product?.image,
    product?.image, // Дублирую для демонстрации галереи
    product?.image
  ].filter(Boolean) as string[];

  useEffect(() => {
    setSelectedSize(bouquetSizes[2].id); // Premium as default
    setCurrentImageIndex(0);
    setActiveTab('reviews'); // Default to reviews
    window.scrollTo(0, 0);
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Товар не найден</div>
          <button
            onClick={onBack}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Вернуться в магазин
          </button>
        </div>
      </div>
    );
  }

  const selectedSizeData = bouquetSizes.find(size => size.id === selectedSize) || bouquetSizes[2];
  const basePrice = parseInt(product.price.replace(/[^\d]/g, ''));
  const finalPrice = Math.round(basePrice * selectedSizeData.priceMultiplier);
  const cartItem = cartItems.find(item => item.id === product.id);
  const isInCart = !!cartItem;

  const handleAddToCart = () => {
    const productWithSize = {
      ...product,
      price: `${finalPrice.toLocaleString()} ₸`,
      title: `${product.title} (${selectedSizeData.name})`
    };
    
    onAddToCart(productWithSize);
  };

  const handleProceedToCheckout = () => {
    onProceedToCheckout();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Назад в магазин</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-1.5 bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6 pb-24 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Left Column - Product Info + Images (lg:2 columns, xl:3 columns) */}
          <div className="lg:col-span-2 xl:col-span-3">
            
            {/* Product Title, Rating and Delivery - Above photos */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-gray-900 mb-3">{product.title}</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-600">({mockReviews.length} отзывов)</span>
                {product.delivery && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-600">{product.delivery}</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
              
              {/* Main Image - Left side */}
              <div className="lg:order-1">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 lg:mb-4">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm px-2 py-1 rounded-full">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="flex gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 lg:w-18 lg:h-18 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-red-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Size Selection - Right side (no price duplication) */}
              <div className="space-y-4 lg:space-y-6 lg:order-2">
                <div>
                  <label className="block font-medium text-gray-900 mb-3">
                    Размер букета
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                    {bouquetSizes.map((size) => {
                      const isSelected = selectedSize === size.id;
                      
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`relative p-3 border rounded-lg text-center transition-colors text-sm ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {size.isPopular && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                          )}
                          
                          <div className="font-medium text-gray-900 mb-1">
                            {size.name}
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-2">
                            {size.description}
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900">
                            {Math.round(basePrice * size.priceMultiplier).toLocaleString()} ₸
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-8 lg:mt-12">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'reviews', label: 'Отзывы' },
                  { id: 'description', label: 'Описание' },
                  { id: 'composition', label: 'Состав' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'reviews' && ` (${mockReviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="py-6 lg:py-8">
                {activeTab === 'reviews' && (
                  <div>
                    {/* Rating Summary */}
                    <div className="bg-gray-50 p-4 lg:p-6 rounded-lg mb-6 lg:mb-8">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-3xl lg:text-4xl font-medium text-gray-900 mb-1">{averageRating.toFixed(1)}</div>
                          <div className="flex items-center justify-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= averageRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {mockReviews.length} отзывов
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((stars) => {
                              const count = mockReviews.filter(r => r.rating === stars).length;
                              const percentage = (count / mockReviews.length) * 100;
                              return (
                                <div key={stars} className="flex items-center gap-3">
                                  <span className="text-sm w-8">{stars} ★</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-yellow-400 h-2 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 w-8">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4 lg:space-y-6">
                      {mockReviews.map((review) => (
                        <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            {/* Review Content */}
                            <div className="md:col-span-2">
                              <div className="flex items-start justify-between mb-3 lg:mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-medium text-gray-900">{review.author}</span>
                                    {review.verified && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Подтвержденная покупка
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-gray-500 text-sm">{review.date}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-gray-700 leading-relaxed mb-4">
                                {review.text}
                              </p>
                              
                              <button className="text-gray-500 hover:text-gray-700 text-sm">
                                Полезно ({review.helpful})
                              </button>
                            </div>

                            {/* Bouquet Photo */}
                            <div className="md:col-span-1">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={review.bouquetPhoto}
                                  alt={`Букет для ${review.author}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-2">
                                Букет, собранный для клиента
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'description' && (
                  <div className="space-y-6 lg:space-y-8">
                    {/* Main Description */}
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        Изысканный букет из свежих цветов, созданный нашими флористами специально для особых моментов. 
                        Каждый цветок тщательно отобран и гармонично сочетается с другими элементами композиции.
                      </p>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Characteristics */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Gift className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Повод</h4>
                        </div>
                        <p className="text-sm text-gray-600">День рождения, романтика, поздравление</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Стиль</h4>
                        </div>
                        <p className="text-sm text-gray-600">Классический букет в крафт-упаковке</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Доставка</h4>
                        </div>
                        <p className="text-sm text-gray-600">2-4 часа по Алматы в специальном боксе</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Свежесть</h4>
                        </div>
                        <p className="text-sm text-gray-600">5-7 дней при правильном уходе</p>
                      </div>
                    </div>

                    {/* Care Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">Рекомендации по уходу</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div className="space-y-2">
                          <p>• Поставьте букет в прохладное место</p>
                          <p>• Избегайте прямых солнечных лучей</p>
                        </div>
                        <div className="space-y-2">
                          <p>• Обновляйте воду каждые 2-3 дня</p>
                          <p>• Подрезайте стебли под углом</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'composition' && (
                  <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
                      <h4 className="font-medium text-gray-900 mb-4 lg:mb-6">Состав букета</h4>
                      <div className="space-y-3 lg:space-y-4">
                        <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-100">
                          <span className="text-gray-700">Красные розы</span>
                          <span className="font-medium text-gray-900">15 шт</span>
                        </div>
                        <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-100">
                          <span className="text-gray-700">Гипсофила</span>
                          <span className="font-medium text-gray-900">3 ветки</span>
                        </div>
                        <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-100">
                          <span className="text-gray-700">Зелень</span>
                          <span className="font-medium text-gray-900">По вкусу флориста</span>
                        </div>
                        <div className="flex justify-between items-center py-2 lg:py-3">
                          <span className="text-gray-700">Упаковочная бумага</span>
                          <span className="font-medium text-gray-900">Крафт</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg mt-4 lg:mt-6">
                        <p className="text-sm text-blue-800">
                          <strong>Примечание:</strong> Состав может незначительно отличаться в зависимости от сезонности и наличия цветов.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Cart (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Оформить заказ</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Размер: {selectedSizeData.name} • {selectedSizeData.description}
                </div>
                <div className="text-xl lg:text-2xl font-medium text-gray-900 mb-4 lg:mb-6">
                  {finalPrice.toLocaleString()} ₸
                </div>
              </div>

              {/* Action Button */}
              {isInCart ? (
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-3 lg:py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Оформить заказ
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-3 lg:py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Добавить в корзину
                </button>
              )}
              
              {cartItem && (
                <div className="text-center text-sm text-gray-600">
                  В корзине: {cartItem.quantity} шт
                </div>
              )}

              {/* Quick Info */}
              <div className="pt-3 lg:pt-4 border-t border-gray-100 space-y-2 lg:space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Доставка 2-4 часа</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Бесплатная открытка</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Свежие цветы</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center gap-3">
          {/* Price Info */}
          <div className="flex-1">
            <div className="text-sm text-gray-600">{selectedSizeData.name}</div>
            <div className="text-lg font-medium text-gray-900">
              {finalPrice.toLocaleString()} ₸
            </div>
          </div>
          
          {/* Dynamic Button */}
          {isInCart ? (
            <button
              onClick={handleProceedToCheckout}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Оформить заказ
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Добавить в корзину
            </button>
          )}
        </div>
        
        {cartItem && (
          <div className="text-center text-sm text-gray-600 mt-1">
            В корзине: {cartItem.quantity} шт
          </div>
        )}
      </div>
    </div>
  );
}