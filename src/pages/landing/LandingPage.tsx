import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Clock, 
  Users, 
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Phone,
  BarChart3,
  Package,
  Calendar,
  MessageSquare,
  Zap,
  Shield,
  Star
} from 'lucide-react';

const LandingPage = () => {
  const [phone, setPhone] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Integrate with auth API
    console.log('Phone submitted:', phone);
    setTimeout(() => {
      setIsLoading(false);
      alert('Спасибо за регистрацию! Мы свяжемся с вами в ближайшее время.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  CRM для цветочного бизнеса
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Управляйте цветочным магазином{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    легко и эффективно
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Забудьте о блокнотах и Excel. Современная CRM система для флористов, 
                  которая экономит время и увеличивает продажи.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
                    <Input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isLoading ? 'Отправка...' : 'Попробовать'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </form>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">250+ флористов</span> уже с нами
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-3xl opacity-20" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-6">
                  <img 
                    src="/api/placeholder/600/400" 
                    alt="CRM Dashboard" 
                    className="rounded-lg w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Знакомые проблемы?
            </h2>
            <p className="text-xl text-gray-600">
              Мы знаем, с чем сталкиваются флористы каждый день
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Тратите часы на учет",
                description: "Записи в блокнотах, потерянные заказы, путаница с остатками"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Теряете клиентов",
                description: "Забываете о важных датах, не помните предпочтения постоянных покупателей"
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Не видите полной картины",
                description: "Сложно понять, что приносит прибыль, а что убытки"
              },
              {
                icon: <Package className="w-6 h-6" />,
                title: "Проблемы со складом",
                description: "Не знаете точных остатков, цветы портятся из-за плохого учета"
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Хаос в коммуникации",
                description: "Заказы теряются между WhatsApp, Instagram и звонками"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Нет аналитики",
                description: "Невозможно планировать закупки и прогнозировать спрос"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Все инструменты в одном месте
              </h2>
              <p className="text-xl text-gray-600">
                CRM система, созданная специально для флористов
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Управление заказами
                </h3>
                <div className="space-y-4">
                  {[
                    "Все заказы в одном месте с удобными статусами",
                    "Автоматический расчет стоимости букетов",
                    "Отслеживание доставки и самовывоза",
                    "История всех заказов клиента",
                    "Уведомления о готовности заказа"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <img 
                  src="/api/placeholder/500/350" 
                  alt="Orders Management" 
                  className="rounded-lg w-full"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1 bg-white rounded-2xl shadow-xl p-6">
                <img 
                  src="/api/placeholder/500/350" 
                  alt="Inventory Management" 
                  className="rounded-lg w-full"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Складской учет
                </h3>
                <div className="space-y-4">
                  {[
                    "Точный учет остатков цветов в реальном времени",
                    "Контроль сроков свежести и списаний",
                    "Автоматический расчет себестоимости",
                    "Уведомления о низких остатках",
                    "История всех поставок и списаний"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  CRM для клиентов
                </h3>
                <div className="space-y-4">
                  {[
                    "База всех клиентов с историей покупок",
                    "Напоминания о важных датах",
                    "Персональные предпочтения и заметки",
                    "Программа лояльности и скидки",
                    "SMS и WhatsApp рассылки"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <img 
                  src="/api/placeholder/500/350" 
                  alt="Customer CRM" 
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Функции, которые увеличат ваши продажи
              </h2>
              <p className="text-xl text-gray-600">
                Все необходимое для успешного цветочного бизнеса
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <ShoppingCart />,
                  title: "Онлайн-витрина",
                  description: "Персональный сайт для приема заказов 24/7"
                },
                {
                  icon: <Calendar />,
                  title: "Календарь доставок",
                  description: "Планирование доставок и напоминания курьерам"
                },
                {
                  icon: <BarChart3 />,
                  title: "Аналитика продаж",
                  description: "Отчеты по прибыли, популярным букетам и клиентам"
                },
                {
                  icon: <Phone />,
                  title: "Интеграция с WhatsApp",
                  description: "Прием заказов прямо из мессенджера"
                },
                {
                  icon: <Users />,
                  title: "Управление командой",
                  description: "Роли для флористов, курьеров и менеджеров"
                },
                {
                  icon: <Zap />,
                  title: "Быстрое оформление",
                  description: "Создание заказа за 30 секунд"
                },
                {
                  icon: <Shield />,
                  title: "Безопасность данных",
                  description: "Защита информации о клиентах и продажах"
                },
                {
                  icon: <Store />,
                  title: "Мультимагазинность",
                  description: "Управление несколькими точками продаж"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                    {React.cloneElement(feature.icon, { className: "w-6 h-6" })}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Simplicity Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Начните работать за 5 минут
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Простая система, которую освоит любой сотрудник
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Регистрация",
                  description: "Введите номер телефона и получите доступ"
                },
                {
                  step: "2",
                  title: "Настройка",
                  description: "Добавьте свои букеты и настройте цены"
                },
                {
                  step: "3",
                  title: "Работа",
                  description: "Принимайте заказы и увеличивайте продажи"
                }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-300 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Флористы о нашей CRM
              </h2>
              <p className="text-xl text-gray-600">
                Истории успеха наших клиентов
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Айгерим",
                  shop: "Цветочный рай, Алматы",
                  text: "За первый месяц продажи выросли на 40%. Теперь не теряю ни одного заказа!",
                  rating: 5
                },
                {
                  name: "Марина",
                  shop: "Розовый сад, Астана",
                  text: "Наконец-то вижу реальную прибыль. Раньше половина денег уходила непонятно куда.",
                  rating: 5
                },
                {
                  name: "Дана",
                  shop: "Flower Power, Шымкент",
                  text: "Клиенты в восторге от возможности отслеживать заказ. Это повысило доверие к магазину.",
                  rating: 5
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.shop}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Готовы увеличить продажи?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Присоединяйтесь к 250+ флористам, которые уже работают эффективнее
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
              <Input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-white"
                required
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={isLoading}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                Начать бесплатно
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            <p className="mt-6 text-sm text-purple-200">
              Бесплатный период 14 дней • Без карты • Отмена в любой момент
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Cvety.kz CRM</h3>
                <p className="text-sm">
                  Современная CRM система для управления цветочным бизнесом в Казахстане
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Продукт</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Возможности</a></li>
                  <li><a href="#" className="hover:text-white">Тарифы</a></li>
                  <li><a href="#" className="hover:text-white">Интеграции</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Поддержка</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Документация</a></li>
                  <li><a href="#" className="hover:text-white">Обучение</a></li>
                  <li><a href="#" className="hover:text-white">Контакты</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Контакты</h4>
                <ul className="space-y-2 text-sm">
                  <li>+7 (707) 123-45-67</li>
                  <li>info@cvety.kz</li>
                  <li>Алматы, Казахстан</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">
                © 2025 Cvety.kz. Все права защищены.
              </p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="text-sm hover:text-white">Политика конфиденциальности</a>
                <a href="#" className="text-sm hover:text-white">Условия использования</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;