import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCheckoutLayout } from './TestCheckoutLayout';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Product {
  id: number;
  name: string;
  description?: string;
  retail_price: number;
  sale_price?: number | null;
  quantity: number;
  image_url?: string | null;
}

interface TestCheckoutContainerProps {
  products: Product[];
  onSubmit: (data: any) => void;
  onClearCart: () => void;
  isLoading?: boolean;
}

export const TestCheckoutContainer: React.FC<TestCheckoutContainerProps> = ({
  products,
  onSubmit,
  onClearCart,
  isLoading = false,
}) => {
  const [deliveryType, setDeliveryType] = useState<'other' | 'self'>('other');
  const [deliveryTime, setDeliveryTime] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardMessage, setCardMessage] = useState('');
  const [showCardMessageInput, setShowCardMessageInput] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'self_pickup'>('delivery');
  const [clarifyAddressWithRecipient, setClarifyAddressWithRecipient] = useState(false);
  const [clarifyTimeWithRecipient, setClarifyTimeWithRecipient] = useState(false);
  const [courierComment, setCourierComment] = useState('');
  const [showCourierComment, setShowCourierComment] = useState(false);
  
  const subtotal = products.reduce((sum, product) => sum + ((product.sale_price || product.retail_price) * product.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 2000 : 0;
  const serviceFee = 990;
  const total = subtotal + deliveryFee + serviceFee;
  
  const handleSubmit = () => {
    // Validate required fields
    if (!customerPhone || (deliveryType === 'other' && (!recipientName || !recipientPhone))) {
      toast.error("Заполните обязательные поля");
      return;
    }
    
    if (deliveryMethod === 'delivery' && !clarifyAddressWithRecipient && !address) {
      toast.error("Укажите адрес доставки");
      return;
    }
    
    const deliveryTimeText = (() => {
      if (clarifyTimeWithRecipient) return 'Уточнить у получателя';
      if (!selectedTimeSlot) return '';
      
      const dateStr = deliveryTime === 'today' 
        ? 'Сегодня' 
        : deliveryTime === 'tomorrow' 
        ? 'Завтра' 
        : format(selectedDate, 'dd.MM.yyyy');
      
      return `${dateStr}, ${selectedTimeSlot}`;
    })();
    
    onSubmit({
      deliveryType,
      deliveryMethod,
      customerPhone,
      customerName,
      recipientName,
      recipientPhone,
      address: clarifyAddressWithRecipient ? 'Уточнить у получателя' : address,
      cardMessage,
      paymentMethod,
      deliveryTimeText,
      courierComment,
    });
  };
  
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
                className="h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold">Оформление заказа</h1>
            </div>
            <button
              onClick={onClearCart}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
            >
              <Trash2 size={14} />
              Очистить
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 py-4 pb-24">
        <TestCheckoutLayout
          products={products}
          deliveryType={deliveryType}
          deliveryTime={deliveryTime}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          paymentMethod={paymentMethod}
          cardMessage={cardMessage}
          showCardMessageInput={showCardMessageInput}
          customerPhone={customerPhone}
          customerName={customerName}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          address={address}
          deliveryMethod={deliveryMethod}
          clarifyAddressWithRecipient={clarifyAddressWithRecipient}
          clarifyTimeWithRecipient={clarifyTimeWithRecipient}
          courierComment={courierComment}
          showCourierComment={showCourierComment}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          serviceFee={serviceFee}
          total={total}
          onDeliveryTypeChange={setDeliveryType}
          onDeliveryTimeChange={setDeliveryTime}
          onSelectedDateChange={setSelectedDate}
          onSelectedTimeSlotChange={setSelectedTimeSlot}
          onPaymentMethodChange={setPaymentMethod}
          onCardMessageChange={setCardMessage}
          setShowCardMessageInput={setShowCardMessageInput}
          onCustomerPhoneChange={setCustomerPhone}
          onCustomerNameChange={setCustomerName}
          onRecipientNameChange={setRecipientName}
          onRecipientPhoneChange={setRecipientPhone}
          onAddressChange={setAddress}
          onDeliveryMethodChange={setDeliveryMethod}
          onClarifyAddressChange={setClarifyAddressWithRecipient}
          onClarifyTimeChange={setClarifyTimeWithRecipient}
          onCourierCommentChange={setCourierComment}
          setShowCourierComment={setShowCourierComment}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};