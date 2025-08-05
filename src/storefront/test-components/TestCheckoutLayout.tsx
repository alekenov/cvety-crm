import React from 'react';
import { TestDeliveryOptions } from './TestDeliveryOptions';
import { TestDeliveryTime } from './TestDeliveryTime';
import { TestRecipientInfo } from './TestRecipientInfo';
import { TestAddressSection } from './TestAddressSection';
import { TestPaymentSection } from './TestPaymentSection';
import { TestCardMessage } from './TestCardMessage';
import { TestCheckoutSummary } from './TestCheckoutSummary';

interface Product {
  id: number;
  name: string;
  description?: string;
  retail_price: number;
  sale_price?: number | null;
  quantity: number;
  image_url?: string | null;
}

interface TestCheckoutLayoutProps {
  products: Product[];
  deliveryType: 'other' | 'self';
  deliveryTime: 'today' | 'tomorrow' | 'custom';
  selectedDate: Date;
  selectedTimeSlot: string;
  paymentMethod: string;
  cardMessage: string;
  showCardMessageInput: boolean;
  customerPhone: string;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  deliveryMethod: 'delivery' | 'self_pickup';
  clarifyAddressWithRecipient: boolean;
  clarifyTimeWithRecipient: boolean;
  courierComment: string;
  showCourierComment: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  onDeliveryTypeChange: (type: 'other' | 'self') => void;
  onDeliveryTimeChange: (time: 'today' | 'tomorrow' | 'custom') => void;
  onSelectedDateChange: (date: Date) => void;
  onSelectedTimeSlotChange: (slot: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onCardMessageChange: (message: string) => void;
  setShowCardMessageInput: (show: boolean) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCustomerNameChange: (name: string) => void;
  onRecipientNameChange: (name: string) => void;
  onRecipientPhoneChange: (phone: string) => void;
  onAddressChange: (address: string) => void;
  onDeliveryMethodChange: (method: 'delivery' | 'self_pickup') => void;
  onClarifyAddressChange: (clarify: boolean) => void;
  onClarifyTimeChange: (clarify: boolean) => void;
  onCourierCommentChange: (comment: string) => void;
  setShowCourierComment: (show: boolean) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const TestCheckoutLayout: React.FC<TestCheckoutLayoutProps> = (props) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Forms */}
      <div className="flex-1 space-y-4">
        {/* Delivery Type Selection */}
        <TestDeliveryOptions
          deliveryType={props.deliveryType}
          onDeliveryTypeChange={props.onDeliveryTypeChange}
        />
        
        {/* Delivery Time */}
        <TestDeliveryTime
          deliveryTime={props.deliveryTime}
          selectedDate={props.selectedDate}
          selectedTimeSlot={props.selectedTimeSlot}
          clarifyTimeWithRecipient={props.clarifyTimeWithRecipient}
          onDeliveryTimeChange={props.onDeliveryTimeChange}
          onSelectedDateChange={props.onSelectedDateChange}
          onSelectedTimeSlotChange={props.onSelectedTimeSlotChange}
          onClarifyTimeChange={props.onClarifyTimeChange}
        />
        
        {/* Recipient Info */}
        <TestRecipientInfo
          deliveryType={props.deliveryType}
          customerName={props.customerName}
          customerPhone={props.customerPhone}
          recipientName={props.recipientName}
          recipientPhone={props.recipientPhone}
          onCustomerNameChange={props.onCustomerNameChange}
          onCustomerPhoneChange={props.onCustomerPhoneChange}
          onRecipientNameChange={props.onRecipientNameChange}
          onRecipientPhoneChange={props.onRecipientPhoneChange}
        />
        
        {/* Address Section */}
        <TestAddressSection
          deliveryMethod={props.deliveryMethod}
          address={props.address}
          clarifyAddressWithRecipient={props.clarifyAddressWithRecipient}
          courierComment={props.courierComment}
          showCourierComment={props.showCourierComment}
          onDeliveryMethodChange={props.onDeliveryMethodChange}
          onAddressChange={props.onAddressChange}
          onClarifyAddressChange={props.onClarifyAddressChange}
          onCourierCommentChange={props.onCourierCommentChange}
          setShowCourierComment={props.setShowCourierComment}
        />
        
        {/* Card Message */}
        <TestCardMessage
          cardMessage={props.cardMessage}
          showCardMessageInput={props.showCardMessageInput}
          onCardMessageChange={props.onCardMessageChange}
          setShowCardMessageInput={props.setShowCardMessageInput}
        />
        
        {/* Payment */}
        <TestPaymentSection
          paymentMethod={props.paymentMethod}
          customerPhone={props.customerPhone}
          deliveryType={props.deliveryType}
          onPaymentMethodChange={props.onPaymentMethodChange}
          onCustomerPhoneChange={props.onCustomerPhoneChange}
        />
      </div>
      
      {/* Right Column - Order Summary */}
      <div className="w-full lg:w-80">
        <TestCheckoutSummary
          products={props.products}
          subtotal={props.subtotal}
          deliveryFee={props.deliveryFee}
          serviceFee={props.serviceFee}
          total={props.total}
          onSubmit={props.onSubmit}
          isLoading={props.isLoading}
        />
      </div>
    </div>
  );
};