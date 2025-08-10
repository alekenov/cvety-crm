import React, { useState } from 'react'
import { Phone, Shield, Loader2 } from 'lucide-react'
import { useTelegram } from '../providers/TelegramProvider'

interface PhoneAuthScreenProps {
  onPhoneReceived: (phone: string) => void
  onError: (error: string) => void
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ 
  onPhoneReceived, 
  onError 
}) => {
  const [isRequesting, setIsRequesting] = useState(false)
  const { requestPhone, haptic, user } = useTelegram()

  const handleRequestPhone = async () => {
    try {
      setIsRequesting(true)
      haptic.impactOccurred('light')
      
      const phone = await requestPhone()
      
      if (phone) {
        haptic.notificationOccurred('success')
        // Форматируем номер если нужно (добавляем + если его нет)
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
        onPhoneReceived(formattedPhone)
      } else {
        haptic.notificationOccurred('error')
        onError('Вы отменили запрос номера телефона')
      }
    } catch (error) {
      haptic.notificationOccurred('error')
      onError('Произошла ошибка при запросе номера телефона')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Иконка и заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Shield className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Добро пожаловать{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-gray-600">
              Для входа в систему CRM необходимо подтвердить ваш номер телефона
            </p>
          </div>

          {/* Информационный блок */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  Безопасная авторизация
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Ваш номер телефона будет использован только для авторизации в системе. 
                  Мы проверим, зарегистрированы ли вы как флорист в нашей базе данных.
                </p>
              </div>
            </div>
          </div>

          {/* Кнопка запроса номера */}
          <button
            onClick={handleRequestPhone}
            disabled={isRequesting}
            className="w-full flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Запрос номера...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5 mr-2" />
                Поделиться номером телефона
              </>
            )}
          </button>

          {/* Дополнительная информация */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Нажимая кнопку, вы соглашаетесь предоставить доступ к вашему номеру телефона
            </p>
          </div>
        </div>

        {/* Помощь */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Возникли проблемы?{' '}
            <button 
              onClick={() => {
                if (window.Telegram?.WebApp) {
                  window.Telegram.WebApp.openTelegramLink('https://t.me/cvety_kz_support')
                }
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Свяжитесь с поддержкой
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PhoneAuthScreen