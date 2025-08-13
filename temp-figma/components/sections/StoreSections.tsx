import svgPaths from "../../imports/svg-2o4p0152yy";
import { useState, useEffect, useRef } from "react";
import { ProductCard, AddToCartButton, FavoriteButton, ProductTag } from "../product/ProductComponents";
import { showcaseProducts, availableProducts, promoProducts, catalogProducts, reviews } from "../../utils/data";
import { Product, CartItem } from "../../types";

// Showcase Section
function ShowcaseSection({ 
  onAddToCart, 
  cartItems,
  onQuickView
}: { 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  return (
    <section className="px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-gray-900">Витрина</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Смотреть все
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
          {showcaseProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              cartItems={cartItems}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Available Section  
function AvailableSection({ 
  onAddToCart, 
  cartItems,
  onQuickView
}: { 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  return (
    <section className="px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-gray-900">В наличии сегодня</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Все товары
          </button>
        </div>
        
        {/* Desktop: All in one row */}
        <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-4">
          {availableProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              cartItems={cartItems}
              onQuickView={onQuickView}
            />
          ))}
        </div>
        
        {/* Mobile: Original layout */}
        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            {availableProducts.slice(0, 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                cartItems={cartItems}
                onQuickView={onQuickView}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-start">
            <div className="w-1/2">
              <ProductCard
                key={availableProducts[2].id}
                product={availableProducts[2]}
                onAddToCart={onAddToCart}
                cartItems={cartItems}
                onQuickView={onQuickView}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Promo Section
function PromoSection({ 
  onAddToCart, 
  cartItems,
  onQuickView
}: { 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  return (
    <section className="px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-gray-900">Акции и скидки</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Все акции
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
          {promoProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              cartItems={cartItems}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Catalog Section
function CatalogSection({ 
  onAddToCart, 
  cartItems,
  onQuickView
}: { 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Available filter options
  const filterCategories = [
    { id: 'roses', name: 'Розы', count: 24 },
    { id: 'tulips', name: 'Тюльпаны', count: 18 },
    { id: 'peonies', name: 'Пионы', count: 12 },
    { id: 'chrysanthemums', name: 'Хризантемы', count: 15 },
    { id: 'carnations', name: 'Гвоздики', count: 8 },
    { id: 'orchids', name: 'Орхидеи', count: 6 }
  ];

  const priceRanges = [
    { id: 'under10k', name: 'До 10 000 ₸', count: 45 },
    { id: '10k-20k', name: '10 000 - 20 000 ₸', count: 32 },
    { id: '20k-30k', name: '20 000 - 30 000 ₸', count: 18 },
    { id: 'over30k', name: 'Свыше 30 000 ₸', count: 8 }
  ];

  const sortOptions = [
    { id: 'popularity', name: 'По популярности' },
    { id: 'price_asc', name: 'По цене ↑' },
    { id: 'price_desc', name: 'По цене ↓' },
    { id: 'newest', name: 'Новые' }
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange('');
  };

  const getCurrentSortName = () => {
    const currentSort = sortOptions.find(sort => sort.id === selectedSort);
    return currentSort?.name || 'Сортировка';
  };

  const handleSortSelect = (sortId: string) => {
    setSelectedSort(sortId);
    setIsSortDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  return (
    <section className="flex flex-col gap-4 lg:gap-6">
      <div className="px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-gray-900">Каталог магазина Cvety.kz</h2>
        </div>
      </div>
      
      {/* Filter Tags and Sort */}
      <div className="px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sort Button */}
            <div className="relative" ref={sortDropdownRef}>
              <button 
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="px-2.5 py-1 text-xs rounded-full transition-colors border border-gray-300 bg-gray-100 hover:border-red-300 hover:text-red-600 flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
                </svg>
                <span>{getCurrentSortName()}</span>
                <svg className={`w-3 h-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isSortDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSortSelect(option.id)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedSort === option.id ? 'bg-red-50 text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Tags */}
            {filterCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedCategories.includes(category.id)
                    ? 'bg-red-400 text-white hover:bg-red-500'
                    : 'border border-gray-200 bg-white hover:border-red-300 hover:text-red-600'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}

            {/* Price Range Tags */}
            {priceRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setSelectedPriceRange(range.id === selectedPriceRange ? '' : range.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedPriceRange === range.id
                    ? 'bg-red-400 text-white hover:bg-red-500'
                    : 'border border-gray-200 bg-white hover:border-red-300 hover:text-red-600'
                }`}
              >
                {range.name.replace(' ₸', '₸')}
              </button>
            ))}

            {/* Clear Filters Tag */}
            {(selectedCategories.length > 0 || selectedPriceRange) && (
              <button 
                onClick={clearFilters}
                className="px-2.5 py-1 text-xs text-gray-500 hover:text-red-600 transition-colors border border-gray-300 rounded-full hover:border-red-300 bg-gray-50 hover:bg-white"
              >
                ✕ Сбросить
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
            {catalogProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                cartItems={cartItems}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Store Info Section
function StoreInfoSection() {
  return (
    <section className="px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6">
          <h3 className="text-gray-900">О магазине Cvety.kz</h3>
          
          {/* Constrained width for better readability */}
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Проверенный продавец</div>
                  <div className="text-xs text-gray-500 mt-1">Работаем с 2018 года</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Быстрая доставка</div>
                  <div className="text-xs text-gray-500 mt-1">В среднем 2-4 часа по Алматы</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Свежие цветы</div>
                  <div className="text-xs text-gray-500 mt-1">Ежедневные поставки из оранжерей</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 lg:pt-4 border-t border-gray-100 max-w-md">
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reviews Section
function ReviewCard({ author, rating, text, date }: {
  author: string;
  rating: number;
  text: string;
  date: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[140px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-900">{author}</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
                <path 
                  d={svgPaths.p1b565580} 
                  fill={i < rating ? "#FF6666" : "#E5E7EB"} 
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-600 flex-1 line-clamp-4">{text}</p>
      <div className="text-xs text-gray-400 mt-2">{date}</div>
    </div>
  );
}

function ReviewsSection() {
  return (
    <section className="px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="text-gray-900">Отзывы покупателей</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Все отзывы
          </button>
        </div>
        {/* Constrained width for better review card proportions */}
        <div className="max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {reviews.map((review, index) => (
              <ReviewCard key={index} {...review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer Section
function Footer() {
  return (
    <footer className="px-4 lg:px-6 py-6 lg:py-8 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-5">
          
          {/* Contacts Section */}
          <div className="space-y-3">
            <h3 className="text-gray-900 text-sm">Контакты</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a href="tel:+77271234567" className="hover:text-red-600 transition-colors">
                  +7 (727) 123-45-67
                </a>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <div>мкр. Самал-2, 111, Алматы</div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Пн-Вс: 8:00 - 22:00</span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-3">
            <h3 className="text-gray-900 text-sm">Навигация</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">Каталог товаров</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">Витрина</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">Акции и скидки</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">О магазине</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">Доставка и оплата</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors py-1">Отзывы</a>
            </div>
          </div>

          {/* Social & Links Section */}
          <div className="space-y-3">
            <h3 className="text-gray-900 text-sm">Мы в соцсетях</h3>
            <div className="space-y-2">
              <a 
                href="https://instagram.com/cvety.kz" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-pink-600 transition-colors"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span>@cvety.kz</span>
              </a>

              <a 
                href="https://wa.me/77271234567" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
                  </svg>
                </div>
                <span>WhatsApp</span>
              </a>

              <a 
                href="https://2gis.kz/almaty/firm/70000001040537472" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <span>2ГИС</span>
              </a>
            </div>
          </div>

          {/* Company Info Section */}
          <div className="space-y-3">
            <h3 className="text-gray-900 text-sm">О компании</h3>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
              <p>Работаем с 2018 года</p>
              <p>Свежие цветы ежедневно</p>
              <p>Быстрая доставка</p>
              <p>1000+ клиентов</p>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="text-xs text-gray-400 text-center">
              © 2024 Cvety.kz • Все права защищены
            </div>
            
            {/* WhatsApp CTA Button */}
            <a 
              href="https://wa.me/77271234567?text=Здравствуйте! Хочу заказать цветы" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg transition-colors text-sm w-full"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
              </svg>
              Написать в WhatsApp
            </a>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-8 mb-8">
            
            {/* Column 1: Contacts */}
            <div className="space-y-4">
              <h3 className="text-gray-900">Контакты</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <a href="tel:+77271234567" className="hover:text-red-600 transition-colors">
                    +7 (727) 123-45-67
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <div>
                    <div>мкр. Самал-2, 111</div>
                    <div>��лматы, Казахстан</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Пн-Вс: 8:00 - 22:00</span>
                </div>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="space-y-4">
              <h3 className="text-gray-900">Навигация</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">Каталог товаров</a>
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">Витрина</a>
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">Акции и скидки</a>
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">О магазине</a>
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">Доставка и оплата</a>
                <a href="#" className="block text-gray-600 hover:text-red-600 transition-colors">Отзывы</a>
              </div>
            </div>

            {/* Column 3: Social & Links */}
            <div className="space-y-4">
              <h3 className="text-gray-900">Мы в соцсетях</h3>
              <div className="space-y-3">
                <a 
                  href="https://instagram.com/cvety.kz" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span>@cvety.kz</span>
                </a>

                <a 
                  href="https://wa.me/77271234567" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </a>

                <a 
                  href="https://2gis.kz/almaty/firm/70000001040537472" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span>2ГИС</span>
                </a>
              </div>
            </div>

            {/* Column 4: Company Info */}
            <div className="space-y-4">
              <h3 className="text-gray-900">О компании</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Работаем с 2018 года</p>
                <p>Свежие цветы ежедневно</p>
                <p>Быстрая доставка по Алматы</p>
                <p>Более 1000 довольных клиентов</p>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200 pt-6 flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © 2024 Cvety.kz • Все права защищены • Интернет-магазин цветов в ��лматы
            </div>
            
            {/* WhatsApp CTA Button */}
            <a 
              href="https://wa.me/77271234567?text=Здравствуйте! Хочу заказать цветы" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
              </svg>
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function StoreSections({ 
  onAddToCart, 
  cartItems,
  onQuickView
}: { 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <CatalogSection onAddToCart={onAddToCart} cartItems={cartItems} onQuickView={onQuickView} />
      <ShowcaseSection onAddToCart={onAddToCart} cartItems={cartItems} onQuickView={onQuickView} />
      <AvailableSection onAddToCart={onAddToCart} cartItems={cartItems} onQuickView={onQuickView} />
      <PromoSection onAddToCart={onAddToCart} cartItems={cartItems} onQuickView={onQuickView} />
      <StoreInfoSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
}