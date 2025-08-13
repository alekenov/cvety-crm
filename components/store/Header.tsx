import svgPaths from "../../imports/svg-2o4p0152yy";

function MarketplaceNav() {
  return (
    <div className="flex items-center gap-2 mb-3 lg:mb-4">
      <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
        </svg>
        <span className="text-sm">Назад к маркетплейсу</span>
      </button>
    </div>
  );
}

function StoreAvatar() {
  return (
    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
      <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="white" viewBox="0 0 24 24">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 8.3 14.3 9 13.5 9S12 8.3 12 7.5V7L9 6.5V7.5C9 8.3 8.3 9 7.5 9S6 8.3 6 7.5V6.5L3 7V9L6 10V12H3V14H6V16L3 17V19L6 18.5V18C6 17.2 6.7 16.5 7.5 16.5S9 17.2 9 18V18.5L12 19V18C12 17.2 12.7 16.5 13.5 16.5S15 17.2 15 18V18.5L18 19V17L15 16V14H18V12H15V10L18 9H21Z"/>
      </svg>
    </div>
  );
}

function StoreInfo() {
  return (
    <div className="flex items-start gap-3 lg:gap-4">
      <StoreAvatar />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 lg:mb-2">
          <h1 className="text-gray-900 truncate">Cvety.kz</h1>
          <div className="flex items-center gap-1 text-emerald-700 text-xs font-medium px-2 py-0.5 bg-emerald-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
            Открыт
          </div>
        </div>
        
        {/* Reviews - shown on all devices */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <div className="size-3">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
                <path d={svgPaths.p1b565580} fill="#9CA3AF" />
              </svg>
            </div>
            <span>4.6</span>
          </div>
          <span>•</span>
          <span>827 отзывов</span>
        </div>

        {/* Delivery info - desktop only, mobile will use separate banner */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 lg:text-xs">
          <span className="text-gray-600">Доставка от 2000 ₸ • По Алматы</span>
          <span className="font-medium text-red-600">2-4 часа</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">Самовывоз • мкр. Самал-2, 111</span>
          <span className="font-medium text-emerald-600">Бесплатно</span>
        </div>
      </div>
    </div>
  );
}

function DeliveryBanner() {
  return (
    <div className="lg:hidden bg-red-50 p-3 rounded-lg border border-red-100">
      {/* Mobile only: Vertical layout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-900">Доставка от 2000 ₸ • По Алматы</span>
          <span className="text-sm font-medium text-red-600">2-4 часа</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-900">Самовывоз • мкр. Самал-2, 111</span>
          <span className="text-sm font-medium text-emerald-600">Бесплатно</span>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="p-4 lg:px-6 lg:py-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <MarketplaceNav />
        <div className="flex flex-col gap-3 lg:gap-0">
          <StoreInfo />
          <DeliveryBanner />
        </div>
      </div>
    </header>
  );
}