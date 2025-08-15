import { Search, User, Menu, X } from "lucide-react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "./mode-toggle"
import { useTheme } from "./theme-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { authApi } from "@/lib/api"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  user?: {
    id: string
    name: string
    role: string
    shop: {
      id: number
      name: string
      phone: string
      city: string
      address?: string
    }
  }
  isMobile?: boolean
  onMenuClick?: () => void
}

export function Header({ user, isMobile, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)

  const handleLogout = async () => {
    try {
      await authApi.logout()
      localStorage.removeItem('authToken')
      navigate('/login')
    } catch (error) {
      // Even if API fails, clear local state and redirect
      localStorage.removeItem('authToken')
      navigate('/login')
    }
  }

  const handleUserMenuClick = (event: React.MouseEvent) => {
    console.log('🔥 User menu button clicked!', { 
      currentState: userMenuOpen,
      event: event.type,
      target: event.target 
    })
    event.preventDefault()
    event.stopPropagation()
    setUserMenuOpen(!userMenuOpen)
    
    // Fallback: если Radix UI не работает, программно триггерим клик
    if (!userMenuOpen && dropdownTriggerRef.current) {
      setTimeout(() => {
        if (dropdownTriggerRef.current && !document.querySelector('[role="menu"]')) {
          console.log('🔧 Fallback: programmatically clicking dropdown trigger')
          dropdownTriggerRef.current.click()
        }
      }, 50)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4 gap-4">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        ) : (
          <SidebarTrigger />
        )}
        
        {isMobile ? (
          <>
            {searchOpen ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Поиск..."
                  className="h-9"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center gap-4">
            <div className="w-full max-w-sm flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="h-9"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isMobile && !searchOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Поиск</span>
            </Button>
          )}
          <ModeToggle theme={theme} setTheme={setTheme} />
          
          <DropdownMenu 
            open={userMenuOpen} 
            onOpenChange={setUserMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button 
                ref={dropdownTriggerRef}
                variant="ghost" 
                size="icon" 
                data-testid="user-menu"
                onClick={handleUserMenuClick}
                onKeyDown={(e) => {
                  console.log('🎹 User menu key pressed:', e.key)
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleUserMenuClick(e as any)
                  }
                }}
                aria-label="Меню пользователя - открыть настройки профиля и выйти"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                style={{ zIndex: 1000 }}
              >
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-64 z-[1001]" 
              style={{ zIndex: 1001 }}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "Пользователь"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role === 'admin' ? 'Администратор' : 
                     user?.role === 'florist' ? 'Флорист' : 
                     user?.role === 'manager' ? 'Менеджер' : 
                     user?.role === 'courier' ? 'Курьер' : user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.shop && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Магазин:</p>
                    <p className="text-sm font-medium">{user.shop.name}</p>
                    <p className="text-xs text-muted-foreground">{user.shop.city}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>Профиль</DropdownMenuItem>
              <DropdownMenuItem>Настройки</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}