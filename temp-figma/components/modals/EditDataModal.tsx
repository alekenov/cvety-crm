import { useState, useEffect } from "react";
import { CheckoutFormData } from "../../types";

export function EditDataModal({
  isOpen,
  type,
  initialData,
  onClose,
  onSave
}: {
  isOpen: boolean;
  type: "recipient" | "card" | "address";
  initialData: CheckoutFormData;
  onClose: () => void;
  onSave: (data: Partial<CheckoutFormData>) => void;
}) {
  const [formData, setFormData] = useState<Partial<CheckoutFormData>>({});

  useEffect(() => {
    if (isOpen) {
      if (type === "recipient") {
        setFormData({
          recipientFirstName: initialData.recipientFirstName,
          recipientPhone: initialData.recipientPhone
        });
      } else if (type === "card") {
        setFormData({
          cardMessage: initialData.cardMessage
        });
      } else if (type === "address") {
        setFormData({
          address: initialData.address,
          apartment: initialData.apartment
        });
      }
    }
  }, [isOpen, type, initialData]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case "recipient": return "Изменить данные получателя";
      case "card": return "Изменить текст открытки";
      case "address": return "Изменить адрес доставки";
      default: return "";
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 max-w-md mx-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">{getTitle()}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {type === "recipient" && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Имя получателя</label>
                <input
                  type="text"
                  value={formData.recipientFirstName || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientFirstName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Телефон получателя</label>
                <input
                  type="tel"
                  value={formData.recipientPhone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors text-sm"
                />
              </div>
            </>
          )}

          {type === "card" && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Текст для открытки</label>
              <textarea
                value={formData.cardMessage || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cardMessage: e.target.value }))}
                rows={3}
                maxLength={200}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors resize-none text-sm"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {(formData.cardMessage?.length || 0)}/200
              </div>
            </div>
          )}

          {type === "address" && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Адрес доставки</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Квартира</label>
                <input
                  type="text"
                  value={formData.apartment || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}