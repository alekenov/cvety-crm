import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  userRole: string | null
  userName: string | null
  shopId: number | null
  shopName: string | null
  login: (token: string, role?: string, userName?: string, shopId?: number, shopName?: string) => void
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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [shopId, setShopId] = useState<number | null>(null)
  const [shopName, setShopName] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем localStorage на наличие токена при инициализации
    const savedToken = localStorage.getItem('access_token')
    const savedRole = localStorage.getItem('user_role')
    const savedUserName = localStorage.getItem('user_name')
    const savedShopId = localStorage.getItem('shop_id')
    const savedShopName = localStorage.getItem('shop_name')
    
    if (savedToken) {
      setAccessToken(savedToken)
      setUserRole(savedRole)
      setUserName(savedUserName)
      setShopId(savedShopId ? parseInt(savedShopId) : null)
      setShopName(savedShopName)
    }
  }, [])

  const login = (token: string, role?: string, userName?: string, shopId?: number, shopName?: string) => {
    setAccessToken(token)
    setUserRole(role || null)
    setUserName(userName || null)
    setShopId(shopId || null)
    setShopName(shopName || null)
    
    localStorage.setItem('access_token', token)
    if (role) localStorage.setItem('user_role', role)
    if (userName) localStorage.setItem('user_name', userName)
    if (shopId) localStorage.setItem('shop_id', shopId.toString())
    if (shopName) localStorage.setItem('shop_name', shopName)
  }

  const logout = () => {
    setAccessToken(null)
    setUserRole(null)
    setUserName(null)
    setShopId(null)
    setShopName(null)
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_name')
    localStorage.removeItem('shop_id')
    localStorage.removeItem('shop_name')
  }

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    accessToken,
    userRole,
    userName,
    shopId,
    shopName,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}