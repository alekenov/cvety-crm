import { useNavigate, useLocation } from 'react-router-dom'
import { Package, ShoppingBag, Bell } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useTelegram } from '../providers/TelegramProvider'

// Utility function
const cn = (...inputs: (string | undefined)[]) => {
  return twMerge(clsx(inputs))
}

const navItems = [
  { path: '/orders', label: 'Заказы', icon: ShoppingBag },
  { path: '/products', label: 'Товары', icon: Package },
  { path: '/notifications', label: 'Уведомления', icon: Bell },
]

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { haptic } = useTelegram()

  const handleNavigate = (path: string) => {
    haptic.impactOccurred('light')
    navigate(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t safe-area-bottom">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}