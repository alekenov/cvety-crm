import { useState } from "react";

export function SupportSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Можно ли изменить время доставки?",
      answer: "Да, время доставки можно изменить до момента подготовки заказа. Нажмите кнопку 'Изменить' в разделе с датой и временем."
    },
    {
      question: "Что делать, если не понравился букет?",
      answer: "Мы можем заменить букет бесплатно в течение 2 часов после доставки. Просто сообщите нам об этом через WhatsApp."
    },
    {
      question: "Доставляете ли вы в выходные?",
      answer: "Да, мы работаем 7 дней в неделю с 8:00 до 22:00. Время доставки может быть увеличено в праздничные дни."
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-gray-900">Нужна помощь?</h3>
      
      {/* FAQ Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Частые вопросы</h4>
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-100 rounded-lg">
            <button
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">{faq.question}</span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {expandedFaq === index && (
              <div className="px-3 pb-3 text-sm text-gray-600">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact buttons */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.686"/>
          </svg>
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900 text-sm">Написать в WhatsApp</div>
            <div className="text-xs text-gray-500">Ответим в течение 5 минут</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900 text-sm">Позвонить +7 (727) 123-45-67</div>
            <div className="text-xs text-gray-500">Работаем с 8:00 до 22:00</div>
          </div>
        </button>
      </div>
    </div>
  );
}