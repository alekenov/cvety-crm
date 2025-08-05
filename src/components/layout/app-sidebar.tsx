import {
  Package,
  ShoppingCart,
  Store,
  ChevronRight,
  Users,
  Flower,
  Calculator,
  Settings,
  UserCog,
  BookOpen,
  PackagePlus,
  ShoppingBag,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps = {}) {
  const location = useLocation()

  const menuGroups = [
    {
      label: "Продажи",
      items: [
        { title: "Заказы", url: "/orders", icon: ShoppingCart },
        { title: "Задания флористам", url: "/production", icon: Flower },
        { title: "Калькулятор букета", url: "/production/calculator", icon: Calculator },
      ]
    },
    {
      label: "Клиенты",
      items: [
        { title: "Клиенты", url: "/customers", icon: Users },
      ]
    },
    {
      label: "Витрина",
      items: [
        { title: "Витрина магазина", url: "/shop/1", icon: ShoppingBag },
      ]
    },
    {
      label: "Товары",
      items: [
        { title: "Каталог товаров", url: "/catalog", icon: BookOpen },
        { title: "Остатки склада", url: "/warehouse", icon: Store },
        { title: "Поставки", url: "/supplies", icon: PackagePlus },
      ]
    },
    {
      label: "Система",
      items: [
        { title: "Общие настройки", url: "/settings", icon: Settings },
        { title: "Пользователи", url: "/settings/users", icon: UserCog },
      ]
    }
  ]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="mb-4">
          <SidebarGroupLabel className="text-lg font-semibold">Cvety.kz</SidebarGroupLabel>
        </SidebarGroup>
        
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            <SidebarGroupLabel className="text-xs uppercase text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={!item.external && location.pathname === item.url}
                    onClick={onNavigate}
                  >
                    {item.external ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                      </a>
                    ) : (
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}