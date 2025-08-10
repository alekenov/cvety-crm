import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import { User, LogOut } from 'lucide-react'

export function UserHeader() {
  const { userName, userRole, shopName, logout } = useAuth()

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'manager':
        return 'Менеджер'
      case 'florist':
        return 'Флорист'
      case 'courier':
        return 'Курьер'
      default:
        return 'Пользователь'
    }
  }

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      logout()
      // В Telegram Mini App можно также закрыть приложение
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close()
      }
    }
  }

  return (
    <div className="bg-white shadow-sm border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">
              {userName || 'Пользователь'}
            </div>
            <div className="text-xs text-gray-500">
              {getRoleLabel(userRole)} • {shopName}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Выйти"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default UserHeader