import { Outlet, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import logoImg from '@/assets/logoseedsgreen-bc966.png'

export default function Layout() {
  const { currentChurch } = useChurch()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-card px-4 shadow-sm md:hidden">
          <SidebarTrigger />
          <img src={logoImg} alt="Seeds" className="h-6 w-auto" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <div className="h-14 border-b bg-card hidden md:flex items-center justify-end px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
        <main className="flex-1 bg-background p-4 md:p-8 overflow-y-auto overflow-x-hidden max-w-full">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
