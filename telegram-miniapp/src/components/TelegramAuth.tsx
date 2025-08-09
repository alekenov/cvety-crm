import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2, Phone, User, AlertCircle } from 'lucide-react'

// Utility function
const cn = (...inputs: (string | undefined)[]) => {
  return twMerge(clsx(inputs))
}

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    contact?: TelegramContact
    auth_date?: number
    hash?: string
  }
  requestContact: (callback?: (shared: boolean) => void) => void
  showPopup: (params: { title?: string; message: string; buttons?: any[] }, callback?: (buttonId: string) => void) => void
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp
    }
  }
}

interface AuthResponse {
  access_token: string
  token_type: string
  shop_id?: number
  shop_name?: string
  needs_phone?: boolean
}

interface TelegramAuthProps {
  onSuccess: (token: string) => void
  onError: (error: string) => void
}

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'default', 
  size = 'default', 
  className = '',
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  [key: string]: any
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    outline: 'border border-gray-300 bg-background hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-12 px-8 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm', className)}>
    {children}
  </div>
)

export const TelegramAuth: React.FC<TelegramAuthProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [authStep, setAuthStep] = useState<'init' | 'phone_request' | 'completing'>('init')
  const [user, setUser] = useState<TelegramUser | null>(null)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      
      // Get user data from initData
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
      if (telegramUser) {
        setUser(telegramUser)
      }
    }
  }, [])

  const handleLogin = async () => {
    if (!window.Telegram?.WebApp) {
      onError('Telegram WebApp не доступен')
      return
    }

    setIsLoading(true)
    setAuthStep('init')

    try {
      // First, try login with just initData (without phone)
      const initData = window.Telegram.WebApp.initData
      
      if (!initData) {
        throw new Error('Данные Telegram недоступны')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/telegram-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: initData,
          phoneNumber: null
        }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка авторизации')
      }

      // If phone is needed, request it
      if (data.needs_phone) {
        setAuthStep('phone_request')
        await requestPhoneNumber(initData)
      } else {
        // Already have access
        onSuccess(data.access_token)
      }

    } catch (error) {
      console.error('Auth error:', error)
      onError(error instanceof Error ? error.message : 'Ошибка авторизации')
    } finally {
      setIsLoading(false)
    }
  }

  const requestPhoneNumber = async (initData: string) => {
    return new Promise<void>((resolve, reject) => {
      setAuthStep('phone_request')

      window.Telegram.WebApp.requestContact((shared) => {
        if (shared) {
          // Contact sharing completed - the phone will be in the next initData
          // We need to get fresh initData after contact sharing
          setTimeout(() => {
            const freshInitData = window.Telegram.WebApp.initData
            completeAuthWithPhone(freshInitData)
            resolve()
          }, 100) // Small delay to ensure initData is updated
        } else {
          reject(new Error('Для просмотра заказов необходимо поделиться номером телефона'))
        }
      })
    })
  }

  const completeAuthWithPhone = async (initData: string) => {
    setAuthStep('completing')
    setIsLoading(true)

    try {
      // Get phone number from fresh initData unsafe object
      let phoneNumber = null
      
      if (window.Telegram?.WebApp?.initDataUnsafe?.contact) {
        phoneNumber = window.Telegram.WebApp.initDataUnsafe.contact.phone_number
      }
      
      // If we still don't have phone, try parsing from initData string
      if (!phoneNumber) {
        const params = new URLSearchParams(initData)
        const contactData = params.get('contact')
        
        if (contactData) {
          try {
            const contact = JSON.parse(decodeURIComponent(contactData))
            phoneNumber = contact.phone_number
          } catch (e) {
            console.error('Failed to parse contact data:', e)
          }
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/telegram-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: initData,
          phoneNumber: phoneNumber
        }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка завершения авторизации')
      }

      onSuccess(data.access_token)

    } catch (error) {
      console.error('Auth completion error:', error)
      onError(error instanceof Error ? error.message : 'Ошибка завершения авторизации')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepContent = () => {
    switch (authStep) {
      case 'init':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Добро пожаловать{user?.first_name ? `, ${user.first_name}` : ''}!
              </h2>
              <p className="text-gray-600 mb-6">
                Войдите для просмотра ваших заказов
              </p>
            </div>
          </div>
        )

      case 'phone_request':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Поделитесь номером телефона</h2>
              <p className="text-gray-600 mb-6">
                Для просмотра ваших заказов необходимо подтвердить номер телефона
              </p>
            </div>
          </div>
        )

      case 'completing':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Завершение авторизации</h2>
              <p className="text-gray-600 mb-6">
                Подождите, идет проверка данных...
              </p>
            </div>
          </div>
        )
    }
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {authStep === 'completing' ? 'Завершение...' : 'Вход...'}
        </>
      )
    }

    switch (authStep) {
      case 'init':
        return 'Войти через Telegram'
      case 'phone_request':
        return 'Поделиться контактом'
      case 'completing':
        return 'Завершение...'
      default:
        return 'Войти'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        {getStepContent()}
        
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isLoading || authStep === 'completing'}
            size="lg"
            className="w-full"
          >
            {getButtonContent()}
          </Button>

          {authStep === 'phone_request' && (
            <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                Ваш номер телефона используется только для идентификации ваших заказов 
                и не передается третьим лицам
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default TelegramAuth