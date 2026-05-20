import { Outlet, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { useChurch } from '@/contexts/church-context'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'

export default function Layout() {
  const { currentChurch, availableChurches } = useChurch()
  const navigate = useNavigate()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 shadow-sm md:hidden">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Controle Seeds</h1>
          </div>
        </header>
        <div className="h-14 border-b bg-card hidden md:flex items-center justify-between px-8">
          <div className="text-sm font-medium text-muted-foreground flex items-center">
            Contexto atual:{' '}
            <span className="text-foreground ml-2 px-2 py-1 bg-secondary rounded-md">
              {currentChurch?.name}
            </span>
          </div>
          {availableChurches.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/select-church')}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Trocar Igreja
            </Button>
          )}
        </div>
        <main className="flex-1 bg-background p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
