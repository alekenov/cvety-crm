import { ShoppingCart, Package, Users, MoreHorizontal } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Flower, Calculator, BookOpen, Store, Settings, UserCog, Truck } from "lucide-react"

const mainTabs = [
  {
    id: "orders",
    label: "Заказы",
    icon: ShoppingCart,
    href: "/orders"
  },
  {
    id: "warehouse",
    label: "Склад",
    icon: Package,
    href: "/warehouse"
  },
  {
    id: "customers",
    label: "Клиенты", 
    icon: Users,
    href: "/customers"
  }
]

const moreItems = [
  {
    id: "production",
    label: "Задания флористам",
    icon: Flower,
    href: "/production"
  },
  {
    id: "calculator",
    label: "Калькулятор букета",
    icon: Calculator,
    href: "/production/calculator"
  },
  {
    id: "catalog",
    label: "Каталог товаров",
    icon: BookOpen,
    href: "/catalog"
  },
  {
    id: "supplies",
    label: "Поставки",
    icon: Store,
    href: "/supplies"
  },
  {
    id: "settings",
    label: "Настройки",
    icon: Settings,
    href: "/settings"
  },
  {
    id: "users",
    label: "Пользователи",
    icon: UserCog,
    href: "/settings/users"
  },
  {
    id: "tracking",
    label: "Трекинг (тест)",
    icon: Truck,
    href: "/tracking/test-token"
  }
]

export function MobileTabBar() {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="grid grid-cols-4 h-16">
          {mainTabs.map((tab) => {
            const isActive = location.pathname === tab.href || 
              (tab.href !== "/" && location.pathname.startsWith(tab.href))
            
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  "hover:text-foreground hover:bg-accent",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
                <span className="truncate px-1">{tab.label}</span>
              </Link>
            )
          })}
          
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
              "hover:text-foreground hover:bg-accent",
              "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="truncate px-1">Ещё</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>Дополнительное меню</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/" && location.pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    "hover:bg-accent",
                    isActive 
                      ? "bg-accent text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}