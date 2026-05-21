import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  LineChart,
  Church,
  UserCog,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import { useChurch } from '@/contexts/church-context'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import logoImg from '@/assets/logoseedsgreen-bc966.png'

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Seeds', url: '/seeds', icon: Users },
  { title: 'Equipe', url: '/equipe', icon: UserCircle },
  { title: 'Eventos', url: '/eventos', icon: Calendar },
  { title: 'Presença', url: '/dashboard-presenca', icon: LineChart },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const { currentChurch, availableChurches, setCurrentChurch } = useChurch()

  const selectableChurches = availableChurches
    .filter((c: any) => !c.event_host)
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    if (location.pathname !== '/' && !currentChurch && selectableChurches.length > 0) {
      setCurrentChurch(selectableChurches[0])
    }
  }, [location.pathname, currentChurch, selectableChurches, setCurrentChurch])

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center px-4 border-b border-border/50 bg-background">
        <Link
          to="/"
          className="flex items-center justify-center transition-transform hover:scale-105 w-full py-2"
        >
          <img src={logoImg} alt="Brand Logo" className="h-8 w-auto" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {selectableChurches.length > 0 && (
          <div className="px-4 py-3 border-b border-border/50 bg-muted/10 flex flex-col gap-1.5">
            {selectableChurches.length > 1 || user?.role === 'admin' ? (
              <Select
                value={currentChurch?.id || 'all'}
                onValueChange={(val) =>
                  setCurrentChurch(
                    val === 'all' ? null : selectableChurches.find((c) => c.id === val)!,
                  )
                }
              >
                <SelectTrigger className="h-8 bg-background border-dashed text-xs shadow-none">
                  <SelectValue placeholder="Selecione a igreja" />
                </SelectTrigger>
                <SelectContent>
                  {location.pathname === '/' && (
                    <SelectItem value="all" className="text-xs font-semibold text-primary">
                      Visão Global
                    </SelectItem>
                  )}
                  {selectableChurches.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <Church className="h-4 w-4 text-primary" />
                <span className="truncate">{currentChurch?.name}</span>
              </div>
            )}
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== '/' && location.pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {user?.role === 'admin' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith('/admin/users')}
                      tooltip="Usuários"
                    >
                      <Link to="/admin/users">
                        <UserCog />
                        <span>Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith('/admin/churches')}
                      tooltip="Igrejas"
                    >
                      <Link to="/admin/churches">
                        <Church />
                        <span>Igrejas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
