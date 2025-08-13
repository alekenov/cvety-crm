import { OrderStatus } from "../../types.js";

export function OrderDetailsSection({ 
  order, 
  onEditData 
}: { 
  order: OrderStatus; 
  onEditData: (type: "recipient" | "card" | "address") => void; 
}) {
  const canEdit = order.status === "preparing" || order.status === "ready";

  return (
    <div className="space-y-3">
      {/* Order Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-900">Заказ #{order.orderNumber}</h3>
          <span className="text-sm text-gray-500">{order.orderDate}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Доставка:</span>
            <span className="text-gray-900">{order.deliveryDate} в {order.deliveryTime}</span>
          </div>
          
          {order.estimatedTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ожидаемое время:</span>
              <span className="text-green-600 font-medium">{order.estimatedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Details */}
      {order.deliveryMethod === "delivery" && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">Данные получателя</h3>
            {canEdit && (
              <button
                onClick={() => onEditData("recipient")}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Изменить
              </button>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Имя: </span>
              <span className="text-gray-900">{order.customerData?.recipientFirstName || order.customerData?.customerFirstName || "Не указано"}</span>
            </div>
            <div>
              <span className="text-gray-600">Телефон: </span>
              <span className="text-gray-900">{order.customerData?.recipientPhone || order.customerData?.customerPhone || "Не указан"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Address */}
      {order.deliveryMethod === "delivery" && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">Адрес доставки</h3>
            {canEdit && (
              <button
                onClick={() => onEditData("address")}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Изменить
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-900">
            {order.customerData?.address || "Адрес не указан"}
            {order.customerData?.apartment && `, кв. ${order.customerData.apartment}`}
          </div>
        </div>
      )}

      {/* Card Message */}
      {order.customerData?.cardMessage && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Текст открытки
            </h3>
            {canEdit && (
              <button
                onClick={() => onEditData("card")}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Изменить
              </button>
            )}
          </div>
          
          <div className="bg-pink-50 p-3 rounded-lg">
            <p className="text-sm text-gray-900 italic">"{order.customerData?.cardMessage}"</p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="text-gray-900">Состав заказа</h3>
        
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className="w-12 h-12 bg-gray-200 rounded-lg bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url('${item.image}')` }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-600">Количество: {item.quantity}</span>
                  <span className="text-sm font-medium text-gray-900">{item.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Товары:</span>
            <span className="text-gray-900">{order.total.toLocaleString()} ₸</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Доставка:</span>
            <span className={order.deliveryFee === 0 ? "text-emerald-600" : "text-gray-900"}>
              {order.deliveryFee === 0 ? "Бесплатно" : `${order.deliveryFee.toLocaleString()} ₸`}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
            <span className="font-medium text-gray-900">Итого:</span>
            <span className="font-medium text-gray-900">{(order.total + order.deliveryFee).toLocaleString()} ₸</span>
          </div>
        </div>
      </div>
    </div>
  );
}