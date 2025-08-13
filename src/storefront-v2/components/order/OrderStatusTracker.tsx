import { OrderStatus } from "../../types.js";

export function OrderStatusTracker({ status }: { status: OrderStatus["status"] }) {
  const steps = [
    { id: "preparing", label: "Подготовка", icon: "🎨" },
    { id: "ready", label: "Готов", icon: "✅" },
    { id: "in_transit", label: "В пути", icon: "🚗" },
    { id: "delivered", label: "Доставлен", icon: "🎉" }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-gray-900 mb-3">Статус заказа</h3>
      
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-green-500 transition-all duration-1000 ease-in-out"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                isCompleted 
                  ? 'bg-green-500 text-white shadow-lg scale-110' 
                  : 'bg-gray-200 text-gray-400'
              } ${isCurrent ? 'animate-pulse' : ''}`}>
                {step.icon}
              </div>
              <span className={`text-xs mt-1 text-center max-w-[60px] leading-tight ${
                isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}