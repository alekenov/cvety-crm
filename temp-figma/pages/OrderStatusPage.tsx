import { useState } from "react";
import { OrderStatus, CheckoutFormData } from "../types";
import { OrderStatusTracker } from "../components/order/OrderStatusTracker";
import { BouquetPhotoSection } from "../components/order/BouquetPhotoSection";
import { OrderDetailsSection } from "../components/order/OrderDetailsSection";
import { SupportSection } from "../components/order/SupportSection";
import { EditDataModal } from "../components/modals/EditDataModal";

export function OrderStatusPage({
  order,
  onBack
}: {
  order: OrderStatus;
  onBack: () => void;
}) {
  const [orderData, setOrderData] = useState<OrderStatus>(order);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    type: "recipient" | "card" | "address";
  }>({ isOpen: false, type: "recipient" });

  const handleRatePhoto = (rating: "like" | "dislike") => {
    setOrderData(prev => ({ ...prev, photoRating: rating }));
  };

  const handleEditData = (type: "recipient" | "card" | "address") => {
    setEditModal({ isOpen: true, type });
  };

  const handleSaveData = (data: Partial<CheckoutFormData>) => {
    setOrderData(prev => ({
      ...prev,
      customerData: { ...prev.customerData, ...data }
    }));
  };

  const handleSharePhoto = () => {
    // Simulate sharing functionality
    if (navigator.share) {
      navigator.share({
        title: 'Мой букет от Cvety.kz',
        text: 'Посмотрите, какой красивый букет я получил!',
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support native sharing
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
            </svg>
            <span className="font-medium">Назад к магазину</span>  
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Left Column - Status and Photo */}
          <div className="space-y-6">
            <OrderStatusTracker status={orderData.status} />
            
            {orderData.bouquetPhoto && (
              <BouquetPhotoSection 
                order={orderData} 
                onRatePhoto={handleRatePhoto}
                onSharePhoto={handleSharePhoto}
              />
            )}
          </div>

          {/* Right Column - Details and Support */}
          <div className="space-y-6">
            <OrderDetailsSection 
              order={orderData} 
              onEditData={handleEditData} 
            />

            <SupportSection />
          </div>
        </div>
      </div>

      <EditDataModal
        isOpen={editModal.isOpen}
        type={editModal.type}
        initialData={orderData.customerData}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        onSave={handleSaveData}
      />
    </div>
  );
}