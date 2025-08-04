import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShoppingCart, Search, Phone, MapPin, Clock, Instagram, MessageCircle } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { shopApi, productsApi } from '../api/client';
import { useCartContext } from '../context/CartContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Shop, Product, ProductListResponse } from '../types';

// Category definitions
const CATEGORIES = [
  { value: 'all', label: 'Все товары', icon: '🌸' },
  { value: 'bouquet', label: 'Букеты', icon: '💐' },
  { value: 'composition', label: 'Композиции', icon: '🌺' },
  { value: 'potted', label: 'Горшечные', icon: '🪴' },
  { value: 'other', label: 'Прочее', icon: '🎁' }
];

// Price filter definitions
const PRICE_FILTERS = [
  { value: 'all', label: 'Все цены', min: null, max: null },
  { value: 'under10k', label: 'До 10 000₸', min: null, max: 10000 },
  { value: '10k-20k', label: '10-20 000₸', min: 10000, max: 20000 },
  { value: 'over20k', label: 'От 20 000₸', min: 20000, max: null }
];

function StorefrontContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { getTotalItems, getTotalPrice } = useCartContext();

  // Get current filters from URL
  const currentCategory = searchParams.get('category') || 'all';
  const currentPriceFilter = searchParams.get('price') || 'all';

  // Fetch data
  useEffect(() => {
    if (!shopId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop info and products in parallel
        const [shopData, productsData] = await Promise.all([
          shopApi.getInfo(Number(shopId)),
          productsApi.getAll({ shop_id: Number(shopId), limit: 50 })
        ]);

        setShop(shopData);
        setProducts((productsData as ProductListResponse).items);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные магазина');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  // Filter products based on category, price, and search
  useEffect(() => {
    let filtered = products;

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(product => product.category === currentCategory);
    }

    // Price filter
    const priceFilter = PRICE_FILTERS.find(f => f.value === currentPriceFilter);
    if (priceFilter && (priceFilter.min !== null || priceFilter.max !== null)) {
      filtered = filtered.filter(product => {
        const price = product.sale_price || product.retail_price;
        if (priceFilter.min !== null && price < priceFilter.min) return false;
        if (priceFilter.max !== null && price > priceFilter.max) return false;
        return true;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(filtered);
  }, [products, currentCategory, currentPriceFilter, searchQuery]);

  // Helper functions
  const updateUrlParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600">{error || 'Магазин не найден'}</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {shop.shop_logo_url ? (
                <img
                  src={shop.shop_logo_url}
                  alt={shop.name}
                  className="h-8 w-auto mr-3"
                />
              ) : null}
              <h1 className="text-xl font-bold text-gray-900">{shop.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              
              <a
                href={`tel:${shop.phone}`}
                className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
              >
                {shop.phone}
              </a>
              {getTotalItems() > 0 && (
                <Button 
                  className="relative"
                  onClick={() => navigate(`/shop/${shopId}/checkout`)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                  <span className="ml-2 hidden sm:inline">
                    {formatPrice(getTotalPrice())}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Info */}
        {shop.description && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <p className="text-gray-600">{shop.description}</p>
            {shop.address && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {shop.address}, {shop.city}
              </p>
            )}
          </div>
        )}

        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Categories and Filters */}
        <Tabs value={currentCategory} onValueChange={(value) => updateUrlParams('category', value)} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.value} value={category.value} className="text-xs sm:text-sm">
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                {getCategoryCount(category.value) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {getCategoryCount(category.value)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Price Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PRICE_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={currentPriceFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => updateUrlParams('price', filter.value)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {CATEGORIES.map((category) => (
            <TabsContent key={category.value} value={category.value} className="mt-0">
              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery.trim() 
                      ? `По запросу "${searchQuery}" ничего не найдено`
                      : 'Товары в этой категории временно отсутствуют'
                    }
                  </p>
                  {(searchQuery.trim() || currentPriceFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery('');
                        updateUrlParams('price', 'all');
                        updateUrlParams('category', 'all');
                      }}
                    >
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Enhanced Footer with Contact Information */}
      <footer className="bg-white mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="h-5 w-5 mr-2" />
                  Контакты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-500" />
                  <a 
                    href={`tel:${shop.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {shop.phone}
                  </a>
                </div>
                
                {shop.whatsapp_number && (
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-3 text-green-500" />
                    <a
                      href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, '')}`}
                      className="text-green-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp: {shop.whatsapp_number}
                    </a>
                  </div>
                )}

                {shop.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">{shop.address}</p>
                      <p className="text-sm text-gray-500">{shop.city}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => window.open(`https://2gis.ru/search/${encodeURIComponent(shop.name + ' ' + shop.address)}`, '_blank')}
                      >
                        Посмотреть на карте
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Время работы
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shop.business_hours ? (
                  <div className="space-y-2">
                    {Object.entries(shop.business_hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-gray-700 capitalize">
                          {day === 'monday' && 'Понедельник'}
                          {day === 'tuesday' && 'Вторник'}
                          {day === 'wednesday' && 'Среда'}
                          {day === 'thursday' && 'Четверг'}
                          {day === 'friday' && 'Пятница'}
                          {day === 'saturday' && 'Суббота'}
                          {day === 'sunday' && 'Воскресенье'}
                        </span>
                        <span className="text-gray-600">
                          {Array.isArray(hours) ? hours.join(', ') : hours}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Ежедневно с 9:00 до 21:00</p>
                )}
              </CardContent>
            </Card>

            {/* About & Social */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">О магазине</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {shop.description || 'Лучшие цветы для ваших близких. Быстрая доставка по городу.'}
                </p>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://instagram.com', '_blank')}
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} {shop.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function StorefrontPage() {
  return <StorefrontContent />;
}