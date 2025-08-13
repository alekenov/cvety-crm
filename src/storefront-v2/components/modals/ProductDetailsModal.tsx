import { useState, useEffect } from "react";
import { Product, CartItem } from "../../types.js";
import { X, Heart, Star, Plus, Minus, Share2, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
}

// Размеры букетов с ценами
const bouquetSizes = [
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
  }
];

// Моковые отзывы
const mockReviews = [
  {
    id: 1,
    author: "Айгуль К.",
    rating: 5,
    date: "10 августа 2025",
    text: "Потрясающий букет! Цветы свежие, доставили точно в срок. Получательница была в восторге!",
    helpful: 12,
    verified: true
  },
  {
    id: 2,
    author: "Дмитрий С.",
    rating: 5,
    date: "8 августа 2025", 
    text: "Заказывал жене на годовщину. Букет превзошел все ожидания, очень качественно упакован.",
    helpful: 8,
    verified: true
  },
  {
    id: 3,
    author: "Мария Л.",
    rating: 4,
    date: "5 августа 2025",
    text: "Красивые цветы, но немного меньше ожидаемого размера. В целом довольна покупкой.",
    helpful: 3,
    verified: false
  }
];

export function ProductDetailsModal({ product, isOpen, onClose, onAddToCart, cartItems }: ProductDetailsModalProps) {
  const [selectedSize, setSelectedSize] = useState(bouquetSizes[0].id);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'composition' | 'reviews'>('description');
  const [isFavorite, setIsFavorite] = useState(false);

  // Моковые изображения - в реальном приложении это будет из product.images
  const images = [
    product?.image,
    product?.image, // Дублирую для демонстрации галереи
    product?.image
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (isOpen) {
      setSelectedSize(bouquetSizes[0].id);
      setQuantity(1);
      setCurrentImageIndex(0);
      setActiveTab('description');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const selectedSizeData = bouquetSizes.find(size => size.id === selectedSize) || bouquetSizes[0];
  const basePrice = parseInt(product.price.replace(/[^\d]/g, ''));
  const finalPrice = Math.round(basePrice * selectedSizeData.priceMultiplier);
  const cartItem = cartItems.find(item => item.id === product.id);

  const handleAddToCart = () => {
    const productWithSize = {
      ...product,
      price: `${finalPrice.toLocaleString()} ₸`,
      title: `${product.title} (${selectedSizeData.name})`
    };
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(productWithSize);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 truncate">{product.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 p-4">
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {/* Image counter */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
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
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
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
          </div>

          {/* Right Column - Product Info */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Price and Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-medium text-gray-900">
                    {finalPrice.toLocaleString()} ₸
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span>({mockReviews.length})</span>
                  </div>
                </div>
                {product.delivery && (
                  <div className="text-sm text-gray-600">
                    {product.delivery}
                  </div>
                )}
              </div>

              {/* Size Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Размер букета
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bouquetSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`relative p-3 border rounded-lg text-center transition-colors ${
                        selectedSize === size.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size.isPopular && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Популярный
                        </div>
                      )}
                      <div className="text-sm font-medium">{size.name}</div>
                      <div className="text-xs text-gray-600">{size.description}</div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {Math.round(basePrice * size.priceMultiplier).toLocaleString()} ₸
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-4">
                <div className="flex border-b border-gray-200">
                  {[
                    { id: 'description', label: 'Описание' },
                    { id: 'composition', label: 'Состав' },
                    { id: 'reviews', label: 'Отзывы' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
              </div>

              {/* Tab Content */}
              <div className="mb-6">
                {activeTab === 'description' && (
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed">
                      Изысканный букет из свежих цветов, созданный нашими флористами специально для особых моментов. 
                      Каждый цветок тщательно отобран и гармонично сочетается с другими элементами композиции.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">Повод:</div>
                        <div className="text-gray-600">День рождения, романтика</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Стиль:</div>
                        <div className="text-gray-600">Классический</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Упаковка:</div>
                        <div className="text-gray-600">Крафт-бумага</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Размер:</div>
                        <div className="text-gray-600">40-50 см</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'composition' && (
                  <div className="space-y-3">
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-700">Красные розы</span>
                        <span className="text-sm text-gray-600">15 шт</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-700">Гипсофила</span>
                        <span className="text-sm text-gray-600">3 ветки</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-700">Зелень</span>
                        <span className="text-sm text-gray-600">По вкусу флориста</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Упаковочная бумага</span>
                        <span className="text-sm text-gray-600">Крафт</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Примечание:</strong> Состав может незначительно отличаться в зависимости от сезонности и наличия цветов.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Rating Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-medium">{averageRating.toFixed(1)}</div>
                        <div className="flex items-center">
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
                          на основе {mockReviews.length} отзывов
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {mockReviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{review.author}</span>
                                {review.verified && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                    Подтвержден
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 ml-1">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed mb-2">
                            {review.text}
                          </p>
                          <button className="text-xs text-gray-500 hover:text-gray-700">
                            Полезно ({review.helpful})
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Quantity */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">Количество:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить в корзину {quantity > 1 && `(${quantity} шт)`}
                <span className="ml-2 font-normal">
                  {(finalPrice * quantity).toLocaleString()} ₸
                </span>
              </button>

              {cartItem && (
                <div className="mt-2 text-center text-sm text-gray-600">
                  В корзине: {cartItem.quantity} шт
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}