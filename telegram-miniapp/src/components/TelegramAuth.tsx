import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

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
  detail?: string // for error responses
}

interface TelegramAuthProps {
  onSuccess: (token: string) => void
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
      
      // Auto-login immediately
      handleLogin()
    } else {
      setIsLoading(false)
      onError('Telegram WebApp не доступен')
    }
  }, [])

  const handleLogin = async () => {
    if (!window.Telegram?.WebApp) {
      onError('Telegram WebApp не доступен')
      return
    }

    setIsLoading(true)

    try {
      const initData = window.Telegram.WebApp.initData
      
      if (!initData) {
        throw new Error('Данные Telegram недоступны')
      }

      // Get phone from URL params (passed by bot)
      const urlParams = new URLSearchParams(window.location.search)
      const phoneNumber = urlParams.get('phone')

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
        throw new Error(data.detail || 'Ошибка авторизации')
      }

      // Successfully authenticated
      onSuccess(data.access_token)

    } catch (error) {
      console.error('Auth error:', error)
      onError(error instanceof Error ? error.message : 'Ошибка авторизации')
    } finally {
      setIsLoading(false)
    }
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