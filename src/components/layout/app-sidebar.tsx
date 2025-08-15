import {
  ShoppingCart,
  ChevronRight,
  Users,
  Settings,
  UserCog,
  BookOpen,
  ShoppingBag,
  Package2,
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
  
  // Get shop_id from localStorage for dynamic shop URL
  const shopId = localStorage.getItem('shopId') || '1'

  const menuItems = [
    { title: "Заказы", url: "/orders", icon: ShoppingCart },
    { title: "Клиенты", url: "/customers", icon: Users },
    { title: "Каталог товаров", url: "/catalog", icon: BookOpen },
    { title: "Склад", url: "/warehouse", icon: Package2 },
    { title: "Витрина магазина", url: `/shop/${shopId}`, icon: ShoppingBag },
    { title: "Настройки", url: "/settings", icon: Settings },
    { title: "Пользователи", url: "/settings/users", icon: UserCog },
  ]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="mb-4">
          <SidebarGroupLabel className="text-lg font-semibold">Cvety.kz</SidebarGroupLabel>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url || 
                    (item.url !== "/" && location.pathname.startsWith(item.url))}
                  onClick={onNavigate}
                >
                  <Link to={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}