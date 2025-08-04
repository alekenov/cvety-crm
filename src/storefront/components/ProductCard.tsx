import { useState } from 'react';
import { ShoppingCart, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import type { Product } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartContext } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useCartContext();
  const cartItem = cart.items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Prepare images array (from product.images API or fallback to main image)
  // For testing: add multiple mock images for first product
  const mockImages = product.id === 1 ? [
    'https://images.cvety.kz/product-1.jpg',
    'https://images.cvety.kz/product-1-alt1.jpg',
    'https://images.cvety.kz/product-1-alt2.jpg',
    'https://images.cvety.kz/product-1-alt3.jpg'
  ] : [];
  
  const images = mockImages.length > 0 
    ? mockImages
    : product.images && product.images.length > 0
    ? product.images.map(img => img.image_url).filter(Boolean)
    : [product.image_url].filter(Boolean);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasDiscount = product.sale_price && product.sale_price < product.retail_price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.sale_price! / product.retail_price) * 100)
    : 0;

  // Navigation handlers
  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div 
          className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100"
          {...swipeHandlers}
        >
          {images.length > 0 ? (
            <>
              {/* Main Image */}
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />

              {/* Navigation Arrows (only show if multiple images) */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image Indicators (only show if multiple images) */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <Badge
                      key={index}
                      variant={index === currentImageIndex ? "default" : "secondary"}
                      className={`w-2 h-2 rounded-full cursor-pointer p-0 ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* No Image Placeholder */
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Product Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.is_new && (
              <Badge className="bg-green-500 text-white text-xs">Новинка</Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-orange-500 text-white text-xs">Хит</Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-xs">-{discountPercentage}%</Badge>
            )}
          </div>

          {/* Image Counter (top left if multiple images) */}
          {images.length > 1 && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                {currentImageIndex + 1}/{images.length}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(product.sale_price!)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.retail_price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-primary">
                {formatPrice(product.retail_price)}
              </span>
            )}
          </div>
          
          {quantity === 0 ? (
            <Button 
              className="w-full"
              onClick={() => addToCart(product)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              В корзину
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(product.id, quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center font-semibold">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(product.id, quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}