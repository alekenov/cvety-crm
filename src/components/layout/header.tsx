import { Search, User, Menu, X } from "lucide-react"
import { useState } from "react"
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
  }
  isMobile?: boolean
  onMenuClick?: () => void
}

export function Header({ user, isMobile, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="user-menu">
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.name || "Пользователь"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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