import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface PrivateRouteProps {
  children: ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem('authToken')

  if (!token) {
    // Сохраняем URL куда пользователь хотел попасть
    const returnUrl = location.pathname + location.search
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />
  }

  return <>{children}</>
}