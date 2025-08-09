import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем localStorage на наличие токена при инициализации
    const savedToken = localStorage.getItem('access_token')
    if (savedToken) {
      setAccessToken(savedToken)
    }
  }, [])

  const login = (token: string) => {
    setAccessToken(token)
    localStorage.setItem('access_token', token)
  }

  const logout = () => {
    setAccessToken(null)
    localStorage.removeItem('access_token')
  }

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    accessToken,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}