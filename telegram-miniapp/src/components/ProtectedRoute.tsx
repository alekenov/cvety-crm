import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/'
}) => {
  const { isAuthenticated, userRole } = useAuth()

  // Проверка авторизации
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Проверка роли если указаны разрешенные роли
  if (allowedRoles.length > 0 && userRole) {
    if (!allowedRoles.includes(userRole)) {
      // Редирект на соответствующую страницу в зависимости от роли
      if (userRole === 'florist') {
        return <Navigate to="/production" replace />
      } else if (userRole === 'courier') {
        return <Navigate to="/deliveries" replace />
      } else if (userRole === 'manager') {
        return <Navigate to="/orders" replace />
      }
      
      return <Navigate to={redirectTo} replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute