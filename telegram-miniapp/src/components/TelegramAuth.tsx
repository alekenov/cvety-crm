import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'
import PhoneAuthScreen from './PhoneAuthScreen'
import { useTelegram } from '../providers/TelegramProvider'

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


// TelegramWebApp interface removed - using types from TelegramProvider

// Type definitions are in TelegramProvider.tsx

interface AuthResponse {
  access_token: string
  token_type: string
  shop_id?: number
  shop_name?: string
  user_role?: string // "admin", "manager", "florist", "courier"
  user_name?: string
  is_new_user?: boolean
  needs_phone?: boolean
  detail?: string // for error responses
}

interface AuthData {
  token: string
  role?: string
  userName?: string
  shopId?: number
  shopName?: string
}

interface TelegramAuthProps {
  onSuccess: (token: string, authData?: AuthData) => void
  onError: (error: string) => void
}

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm', className)}>
    {children}
  </div>
)

export const TelegramAuth: React.FC<TelegramAuthProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [needsPhoneAuth, setNeedsPhoneAuth] = useState(false)
  // const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const { contact } = useTelegram()

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      // WebApp.ready() and expand() are already called in TelegramProvider
      
      // Get user data from initData
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
      if (telegramUser) {
        setUser(telegramUser)
      }
      
      // Check if we already have phone from contact or URL
      const urlParams = new URLSearchParams(window.location.search)
      const urlPhone = urlParams.get('phone')
      const contactPhone = contact?.phoneNumber
      
      if (urlPhone || contactPhone) {
        // setPhoneNumber(urlPhone || contactPhone || null)
        handleLogin(urlPhone || contactPhone || null)
      } else {
        // No phone available, need to request it
        setIsLoading(false)
        setNeedsPhoneAuth(true)
      }
    } else {
      setIsLoading(false)
      onError('Telegram WebApp не доступен')
    }
  }, [contact])

  const handlePhoneReceived = (phone: string) => {
    // setPhoneNumber(phone)
    setNeedsPhoneAuth(false)
    setIsLoading(true)
    handleLogin(phone)
  }

  const handlePhoneError = (error: string) => {
    onError(error)
  }

  const handleLogin = async (phone: string | null) => {
    if (!window.Telegram?.WebApp) {
      onError('Telegram WebApp не доступен')
      return
    }

    if (!phone) {
      setIsLoading(false)
      setNeedsPhoneAuth(true)
      return
    }

    setIsLoading(true)

    try {
      const initData = window.Telegram.WebApp.initData
      
      if (!initData) {
        throw new Error('Данные Telegram недоступны')
      }

      // Сначала пробуем авторизовать как флориста
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/florist-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: initData,
          phoneNumber: phone
        }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok) {
        // Если флорист не найден, пробуем обычную авторизацию
        if (response.status === 404) {
          const regularResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/telegram-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData: initData,
              phoneNumber: phone
            }),
          })
          
          const regularData: AuthResponse = await regularResponse.json()
          
          if (!regularResponse.ok) {
            throw new Error(regularData.detail || 'Ошибка авторизации')
          }
          
          // Successfully authenticated as regular user
          const regularAuthData = {
            token: regularData.access_token,
            role: regularData.user_role || 'admin',
            userName: regularData.user_name,
            shopId: regularData.shop_id,
            shopName: regularData.shop_name
          }
          onSuccess(regularData.access_token, regularAuthData)
          return
        }
        
        throw new Error(data.detail || 'Ошибка авторизации')
      }

      // Successfully authenticated as florist
      const authData = {
        token: data.access_token,
        role: data.user_role || 'florist',
        userName: data.user_name,
        shopId: data.shop_id,
        shopName: data.shop_name
      }
      onSuccess(data.access_token, authData)

    } catch (error) {
      console.error('Auth error:', error)
      onError(error instanceof Error ? error.message : 'Ошибка авторизации')
    } finally {
      setIsLoading(false)
    }
  }



  // Если нужна авторизация по номеру телефона
  if (needsPhoneAuth && !isLoading) {
    return (
      <PhoneAuthScreen 
        onPhoneReceived={handlePhoneReceived}
        onError={handlePhoneError}
      />
    )
  }

  if (!isLoading) {
    return null // Auth complete or failed, parent will handle
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Авторизация{user?.first_name ? `, ${user.first_name}` : ''}...
            </h2>
            <p className="text-gray-600">
              Подождите, выполняется вход в систему
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TelegramAuth