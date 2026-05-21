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
