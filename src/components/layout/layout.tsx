import { ReactNode, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { Toaster } from "sonner"
import { useIsMobile } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MobileTabBar } from "./mobile-tab-bar"

interface LayoutProps {
  children: ReactNode
}

const mockUser = {
  id: "1",
  name: "Алибек Акенов",
  role: "admin"
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header 
          user={mockUser} 
          isMobile={true}
          onMenuClick={() => setMobileOpen(true)}
        />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto">
            <SheetHeader className="p-4 pb-0">
              <SheetTitle>Меню</SheetTitle>
            </SheetHeader>
            <div className="h-full">
              <SidebarProvider>
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </SidebarProvider>
            </div>
          </SheetContent>
        </Sheet>
        <main className="flex-1 p-4 pb-20">
          {children}
        </main>
        <MobileTabBar />
        <Toaster richColors position="top-center" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header user={mockUser} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}