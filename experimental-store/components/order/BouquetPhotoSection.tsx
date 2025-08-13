import { OrderStatus } from "../../types";

export function BouquetPhotoSection({ 
  order, 
  onRatePhoto,
  onSharePhoto
}: { 
  order: OrderStatus; 
  onRatePhoto: (rating: "like" | "dislike") => void;
  onSharePhoto: () => void;
}) {
  if (!order.bouquetPhoto) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Фото вашего букета</h3>
        <button
          onClick={onSharePhoto}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
          </svg>
          Поделиться
        </button>
      </div>
      <p className="text-sm text-gray-600">Мы подготовили ваш букет и сделали фото перед доставкой</p>
      
      {/* Photo */}
      <div className="relative">
        <div
          className="w-full aspect-square bg-gray-100 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url('${order.bouquetPhoto}')` }}
        />
      </div>

      {/* Rating buttons */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">Как вам букет?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRatePhoto("like")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
              order.photoRating === "like"
                ? 'bg-green-100 text-green-700 border border-green-300 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:scale-105'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            </svg>
            Нравится
          </button>
          
          <button
            onClick={() => onRatePhoto("dislike")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
              order.photoRating === "dislike"
                ? 'bg-red-100 text-red-700 border border-red-300 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:scale-105'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
            </svg>
            Не нравится
          </button>
        </div>
      </div>

      {order.photoRating && (
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {order.photoRating === "like" 
              ? "Спасибо за оценку! Мы рады, что букет вам понравился 💚"
              : "Спасибо за честную оценку. Мы учтем ваши пожелания в следующих заказах 🙏"
            }
          </p>
        </div>
      )}
    </div>
  );
}