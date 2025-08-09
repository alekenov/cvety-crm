import React from 'react'
import { Bell } from 'lucide-react'

// Placeholder component for notifications
export const NotificationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-gray-900">Уведомления</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Bell className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет уведомлений</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Уведомления будут отображаться здесь
        </p>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}

export default NotificationsPage