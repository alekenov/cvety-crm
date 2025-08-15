import { useState, useEffect } from "react";
const imgImage6 = "https://via.placeholder.com/400x400/FFE5E5/FF6B6B?text=Flower+1";
import { CartItem, CheckoutFormData, OrderStatus } from "../types.js";

// Field Validation Component
function FormField({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-gray-700 mb-2">{label}</label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}

// Date Time Selection Component
function DateTimeSection({
  formData,
  onInputChange,
  showClarifyOption = true
}: {
  formData: CheckoutFormData;
  onInputChange: (field: keyof CheckoutFormData, value: string | boolean) => void;
  showClarifyOption?: boolean;
}) {
  // Generate available dates (today, tomorrow, day after tomorrow)
  const getAvailableDates = () => {
    const today = new Date();
    const dates = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      let dayLabel = '';
      if (i === 0) dayLabel = 'Сегодня';
      else if (i === 1) dayLabel = 'Завтра';
      else dayLabel = 'Послезавтра';
      
      dates.push({
        value: date.toISOString().split('T')[0],
        label: dayLabel,
        dateObj: date
      });
    }
    
    return dates;
  };

  // Generate available time slots based on selected date and delivery method
  const getAvailableTimeSlots = () => {
    const selectedDate = formData.deliveryDate;
    const today = new Date();
    const isToday = selectedDate === today.toISOString().split('T')[0];
    
    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();
    
    // Base time slots - for pickup use store hours (wider range)
    const baseSlots = formData.deliveryMethod === "pickup" 
      ? [
          "10:00-12:00",
          "12:00-14:00", 
          "14:00-16:00",
          "16:00-18:00",
          "18:00-20:00",
          "20:00-22:00"
        ]
      : [
          "10:00-12:00",
          "12:00-14:00", 
          "14:00-16:00",
          "16:00-18:00",
          "18:00-20:00",
          "20:00-22:00"
        ];
    
    if (!isToday) {
      return baseSlots;
    }
    
    // Filter out past time slots for today
    const availableSlots = baseSlots.filter(slot => {
      const slotStart = parseInt(slot.split(':')[0]);
      const slotStartMinutes = parseInt(slot.split(':')[1].split('-')[0]);
      
      // Add preparation buffer: 2 hours for delivery, 1 hour for pickup
      const buffer = formData.deliveryMethod === "pickup" ? 60 : 120;
      const slotStartTime = slotStart * 60 + slotStartMinutes;
      const currentTime = currentHour * 60 + currentMinutes + buffer;
      
      return slotStartTime > currentTime;
    });
    
    return availableSlots.length > 0 ? availableSlots : [];
  };

  const availableDates = getAvailableDates();
  const availableTimeSlots = getAvailableTimeSlots();

  // Auto-select first available date if none selected using useEffect
  useEffect(() => {
    if (!formData.deliveryDate && availableDates.length > 0) {
      onInputChange('deliveryDate', availableDates[0].value);
    }
  }, [formData.deliveryDate, availableDates, onInputChange]);

  const getTitle = () => {
    if (formData.deliveryMethod === "pickup") {
      return "Дата и время получения";
    }
    return "Дата и время доставки";
  };

  const getUnavailableMessage = () => {
    if (formData.deliveryMethod === "pickup") {
      return "Самовывоз на сегодня недоступен. Выберите другую дату.";
    }
    return "Доставка на сегодня недоступна. Выберите другую дату.";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3 className="text-gray-900">{getTitle()}</h3>
      </div>

      {/* Date Selection - Horizontal buttons */}
      <div>
        <div className="grid grid-cols-3 gap-2 lg:gap-3 max-w-sm">
          {availableDates.map((date) => (
            <button
              key={date.value}
              onClick={() => {
                onInputChange('deliveryDate', date.value);
              }}
              className={`px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-center text-sm lg:text-base ${
                formData.deliveryDate === date.value
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      {/* Separator between date and time */}
      {formData.deliveryDate && (
        <hr className="border-gray-200" />
      )}

      {/* Time Selection - only show if date is selected */}
      {formData.deliveryDate && (
        <div>
          {/* Time Slots - Horizontal buttons */}
          {availableTimeSlots.length === 0 ? (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 max-w-md">
              <p className="text-yellow-800 text-sm">
                {getUnavailableMessage()}
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-w-md">
                {availableTimeSlots.map((timeSlot) => (
                  <button
                    key={timeSlot}
                    onClick={() => {
                      onInputChange('deliveryTime', timeSlot);
                    }}
                    className={`px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-center text-sm lg:text-base ${
                      formData.deliveryTime === timeSlot && !formData.clarifyWithRecipient
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>

              {/* Clarify with recipient option - as checkbox - only for delivery */}
              {showClarifyOption && (
                <label className="flex items-start gap-3 cursor-pointer max-w-md">
                  <input
                    type="checkbox"
                    checked={formData.clarifyWithRecipient}
                    onChange={(e) => {
                      onInputChange('clarifyWithRecipient', e.target.checked);
                      if (e.target.checked) {
                        onInputChange('deliveryTime', '');
                      }
                    }}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      <span className="text-gray-900 text-sm lg:text-base">Уточнить у получателя</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Мы позвоним получателю и согласуем удобное время
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CheckoutPage({
  cartItems,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onOrderComplete,
  onCreateOrder
}: {
  cartItems: CartItem[];
  onBack: () => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onOrderComplete: (order: OrderStatus) => void;
  onCreateOrder?: (formData: any, cartItems: CartItem[]) => Promise<any>;
}) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    deliveryMethod: "delivery",
    deliveryDate: "",
    deliveryTime: "",
    clarifyWithRecipient: false,
    customerFirstName: "",
    customerPhone: "",
    recipientFirstName: "",
    recipientPhone: "",
    address: "",
    apartment: "",
    paymentMethod: "cash",
    cardMessage: "",
    comments: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('checkout-form-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved form data');
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkout-form-data', JSON.stringify(formData));
  }, [formData]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ''));
    return sum + (price * item.quantity);
  }, 0);

  const deliveryFee = formData.deliveryMethod === "delivery" ? 2000 : 0;
  const finalTotal = totalPrice + deliveryFee;

  const validateField = (field: keyof CheckoutFormData, value: string | boolean) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'customerFirstName':
      case 'recipientFirstName':
        if (typeof value === 'string' && value.trim().length < 2) {
          newErrors[field] = 'Имя должно содержать минимум 2 символа';
        } else {
          delete newErrors[field];
        }
        break;
      case 'customerPhone':
      case 'recipientPhone':
        if (typeof value === 'string' && !/^[+]?[0-9\s\-\(\)]{10,}$/.test(value.trim())) {
          newErrors[field] = 'Введите корректный номер телефона';
        } else {
          delete newErrors[field];
        }
        break;
      case 'address':
        if (typeof value === 'string' && value.trim().length < 5) {
          newErrors[field] = 'Адрес слишком короткий';
        } else {
          delete newErrors[field];
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const requiredFields = formData.deliveryMethod === "delivery" 
      ? ['customerFirstName', 'customerPhone', 'recipientFirstName', 'recipientPhone', 'address']
      : ['customerFirstName', 'customerPhone'];

    let hasErrors = false;
    requiredFields.forEach(field => {
      const value = formData[field as keyof CheckoutFormData];
      if (typeof value === 'string' && !value.trim()) {
        hasErrors = true;
      }
      validateField(field as keyof CheckoutFormData, value as string);
    });

    if (hasErrors || Object.keys(errors).length > 0) {
      return;
    }

    // If API integration is available, use it
    if (onCreateOrder) {
      try {
        const apiFormData = {
          deliveryType: formData.deliveryMethod as 'delivery' | 'pickup',
          deliveryDate: formData.deliveryDate,
          deliveryTime: formData.deliveryTime || (formData.clarifyWithRecipient ? 'Уточнить у получателя' : ''),
          customerName: formData.customerFirstName,
          customerPhone: formData.customerPhone,
          recipientName: formData.recipientFirstName,
          recipientPhone: formData.recipientPhone,
          deliveryAddress: formData.address,
          city: 'Алматы',
          apartment: formData.apartment,
          cardText: formData.cardMessage,
          paymentMethod: formData.paymentMethod as 'cash' | 'card',
          specialRequests: formData.comments
        };
        
        const response = await onCreateOrder(apiFormData, cartItems);
        if (response) {
          const order: OrderStatus = {
            id: response.id.toString(),
            orderNumber: response.tracking_token,
            status: response.status as any,
            orderDate: new Date(response.created_at).toLocaleDateString('ru-RU'),
            deliveryDate: formData.deliveryDate,
            deliveryTime: formData.deliveryTime,
            items: cartItems,
            total: totalPrice,
            deliveryFee,
            deliveryMethod: formData.deliveryMethod,
          };
          onOrderComplete(order);
          return;
        }
      } catch (error) {
        console.error('Failed to create order via API:', error);
        // Fallback to mock order creation
      }
    }

    // Fallback: Create mock order
    const order: OrderStatus = {
      id: `order_${Date.now()}`,
      orderNumber: `CV${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: "preparing",
      orderDate: new Date().toLocaleDateString('ru-RU'),
      deliveryDate: formData.deliveryDate,
      deliveryTime: formData.deliveryTime,
      items: cartItems,
      total: totalPrice,
      deliveryFee,
      deliveryMethod: formData.deliveryMethod,
      customerData: formData,
      bouquetPhoto: imgImage6, // Mock photo
      photoRating: null,
      estimatedTime: "2-4 часа"
    };

    // Clear saved form data after successful order
    localStorage.removeItem('checkout-form-data');
    onOrderComplete(order);
  };

  const requiredFields = formData.deliveryMethod === "delivery" 
    ? [formData.customerFirstName, formData.customerPhone, formData.recipientFirstName, formData.recipientPhone, formData.address]
    : [formData.customerFirstName, formData.customerPhone];

  // Both delivery and pickup now require date/time selection
  const isDateTimeValid = formData.deliveryDate && (formData.deliveryTime || formData.clarifyWithRecipient);

  const isFormValid = requiredFields.every(field => field.trim() !== "") && isDateTimeValid && Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
            </svg>
            <span className="font-medium">Вернуться к корзине</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6 pb-24 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column - Checkout Form (lg:2 columns) */}
          <div className="lg:col-span-2">
            {/* Constrain form width on desktop - reduced from max-w-3xl to max-w-2xl */}
            <div className="max-w-2xl space-y-4 lg:space-y-5">
              
              {/* Delivery Method - FIRST */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                <h3 className="text-gray-900">Способ получения</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-xl">
                  <label className="flex items-start gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="delivery"
                      checked={formData.deliveryMethod === "delivery"}
                      onChange={(e) => handleInputChange("deliveryMethod", e.target.value)}
                      className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm lg:text-base">Доставка курьером</span>
                        <span className="text-gray-900 text-sm lg:text-base">2 000 ₸</span>
                      </div>
                      <p className="text-gray-500 text-xs lg:text-sm">2-4 часа по Алматы</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={formData.deliveryMethod === "pickup"}
                      onChange={(e) => handleInputChange("deliveryMethod", e.target.value)}
                      className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm lg:text-base">Самовывоз</span>
                        <span className="text-emerald-600 text-sm lg:text-base">Бесплатно</span>
                      </div>
                      <p className="text-gray-500 text-xs lg:text-sm">мкр. Самал-2, 111</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Date and Time Selection */}
              <DateTimeSection
                formData={formData}
                onInputChange={handleInputChange}
                showClarifyOption={formData.deliveryMethod === "delivery"}
              />

              {/* Customer Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                <h3 className="text-gray-900">
                  {formData.deliveryMethod === "delivery" ? "Данные заказчика" : "Ваши данные"}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <FormField label="Имя" error={errors.customerFirstName}>
                    <input
                      type="text"
                      value={formData.customerFirstName}
                      onChange={(e) => handleInputChange("customerFirstName", e.target.value)}
                      placeholder="Имя"
                      maxLength={25}
                      className={`w-full p-2.5 lg:p-3 border rounded-lg focus:outline-none transition-colors text-sm lg:text-base ${
                        errors.customerFirstName 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-300 focus:border-red-400'
                      }`}
                    />
                  </FormField>

                  <FormField label="Телефон" error={errors.customerPhone}>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="+7 (777) 123 45 67"
                      maxLength={20}
                      className={`w-full p-2.5 lg:p-3 border rounded-lg focus:outline-none transition-colors text-sm lg:text-base ${
                        errors.customerPhone 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-300 focus:border-red-400'
                      }`}
                    />
                  </FormField>
                </div>
              </div>

              {/* Recipient Information - Only for delivery */}
              {formData.deliveryMethod === "delivery" && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                  <h3 className="text-gray-900">Данные получателя</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <FormField label="Имя получателя" error={errors.recipientFirstName}>
                      <input
                        type="text"
                        value={formData.recipientFirstName}
                        onChange={(e) => handleInputChange("recipientFirstName", e.target.value)}
                        placeholder="Имя"
                        maxLength={25}
                        className={`w-full p-2.5 lg:p-3 border rounded-lg focus:outline-none transition-colors text-sm lg:text-base ${
                          errors.recipientFirstName 
                            ? 'border-red-300 focus:border-red-400' 
                            : 'border-gray-300 focus:border-red-400'
                        }`}
                      />
                    </FormField>

                    <FormField label="Телефон получателя" error={errors.recipientPhone}>
                      <input
                        type="tel"
                        value={formData.recipientPhone}
                        onChange={(e) => handleInputChange("recipientPhone", e.target.value)}
                        placeholder="+7 (777) 123 45 67"
                        maxLength={20}
                        className={`w-full p-2.5 lg:p-3 border rounded-lg focus:outline-none transition-colors text-sm lg:text-base ${
                          errors.recipientPhone 
                            ? 'border-red-300 focus:border-red-400' 
                            : 'border-gray-300 focus:border-red-400'
                        }`}
                      />
                    </FormField>
                  </div>

                  <div className="pt-3 lg:pt-4 space-y-3 lg:space-y-4 border-t border-gray-100">
                    <div className="max-w-xl">
                      <FormField label="Адрес доставки" error={errors.address}>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Улица, дом"
                          maxLength={60}
                          className={`w-full p-2.5 lg:p-3 border rounded-lg focus:outline-none transition-colors text-sm lg:text-base ${
                            errors.address 
                              ? 'border-red-300 focus:border-red-400' 
                              : 'border-gray-300 focus:border-red-400'
                          }`}
                        />
                      </FormField>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm lg:text-base">Город</label>
                        <input
                          type="text"
                          value="Алматы"
                          disabled
                          className="w-full p-2.5 lg:p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm lg:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm lg:text-base">Квартира</label>
                        <input
                          type="text"
                          value={formData.apartment}
                          onChange={(e) => handleInputChange("apartment", e.target.value)}
                          placeholder="Кв. 123"
                          maxLength={10}
                          className="w-full p-2.5 lg:p-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors text-sm lg:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Message */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  <h3 className="text-gray-900">Текст для открытки</h3>
                  <span className="text-xs text-gray-500">(опционально)</span>
                </div>
                <div className="max-w-xl">
                  <textarea
                    value={formData.cardMessage}
                    onChange={(e) => handleInputChange("cardMessage", e.target.value)}
                    placeholder="Напишите поздравление или пожелание для открытки..."
                    rows={3}
                    maxLength={150}
                    className="w-full p-2.5 lg:p-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors resize-none text-sm lg:text-base"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {formData.cardMessage?.length || 0}/150
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                <h3 className="text-gray-900">Способ оплаты</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-xl">
                  <label className="flex items-start gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                      className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-gray-900 text-sm lg:text-base">Наличными при получении</span>
                      <p className="text-gray-500 mt-1 text-xs lg:text-sm">Оплата курьеру или в точке самовывоза</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                      className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-gray-900 text-sm lg:text-base">Картой при получении</span>
                      <p className="text-gray-500 mt-1 text-xs lg:text-sm">Оплата картой курьеру или в точке самовывоза</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Comments */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-3 lg:space-y-4">
                <h3 className="text-gray-900">Дополнительные пожелания</h3>
                <div className="max-w-xl">
                  <textarea
                    value={formData.comments}
                    onChange={(e) => handleInputChange("comments", e.target.value)}
                    placeholder="Укажите этаж, домофон и другие пожелания..."
                    rows={3}
                    maxLength={200}
                    className="w-full p-2.5 lg:p-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors resize-none text-sm lg:text-base"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {formData.comments?.length || 0}/200
                  </div>
                </div>
              </div>

              {/* Mobile Order Summary - Only on mobile */}
              <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <h3 className="text-gray-900">Ваш заказ ({totalItems})</h3>
                
                {/* Cart Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="relative">
                        <div
                          className="w-12 h-12 bg-gray-200 rounded-lg bg-cover bg-center shrink-0"
                          style={{ backgroundImage: `url('${item.image}')` }}
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {item.quantity}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-2 leading-tight mb-1 text-sm">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 text-sm">{item.price}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                              </svg>
                            </button>
                            
                            <span className="font-medium text-gray-900 w-5 text-center text-sm">{item.quantity}</span>
                            
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="pt-4 border-t border-gray-200 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Товары ({totalItems})</span>
                    <span className="text-gray-900">{totalPrice.toLocaleString()} ₸</span>
                  </div>
                  
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Доставка</span>
                      <span className="text-gray-900">{deliveryFee.toLocaleString()} ₸</span>
                    </div>
                  )}
                  
                  <hr className="border-gray-200"/>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Итого</span>
                    <span className="text-lg font-medium text-gray-900">{finalTotal.toLocaleString()} ₸</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Order Summary (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-4 lg:p-5 space-y-4 lg:space-y-5">
              <h3 className="text-gray-900">Ваш заказ ({totalItems})</h3>
              
              {/* Cart Items */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="relative">
                      <div
                        className="w-14 h-14 bg-gray-200 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url('${item.image}')` }}
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {item.quantity}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2 leading-tight mb-2 text-sm">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 text-sm">{item.price}</p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                            </svg>
                          </button>
                          
                          <span className="font-medium text-gray-900 w-5 text-center text-sm">{item.quantity}</span>
                          
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары ({totalItems})</span>
                  <span className="text-gray-900">{totalPrice.toLocaleString()} ₸</span>
                </div>
                
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доставка</span>
                    <span className="text-gray-900">{deliveryFee.toLocaleString()} ₸</span>
                  </div>
                )}
                
                <hr className="border-gray-200"/>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Итого</span>
                  <span className="text-lg font-medium text-gray-900">{finalTotal.toLocaleString()} ₸</span>
                </div>
              </div>

              {/* Order Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm lg:text-base ${
                  isFormValid
                    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                </svg>
                Оформить заказ
              </button>

              {/* Quick Info */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-gray-600">Безопасная оплата</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-gray-600">Точная доставка</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar - Mobile Only (Simplified) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between gap-4">
          {/* Simple Total */}
          <div className="flex-1">
            <div className="text-lg font-medium text-gray-900">
              Итого: {finalTotal.toLocaleString()} ₸
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg text-sm ${
              isFormValid
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
            </svg>
            Оформить заказ
          </button>
        </div>
      </div>
    </div>
  );
}