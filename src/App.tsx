import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ChurchProvider, useChurch } from '@/contexts/church-context'
import { AppProvider } from '@/contexts/app-context'
import { Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Index from './pages/Index'
import Seeds from './pages/Seeds'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import EventCheckIn from './pages/EventCheckIn'
import Equipe from './pages/Equipe'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import SelectChurch from './pages/SelectChurch'
import ManageChurches from './pages/admin/ManageChurches'
import ManageUsers from './pages/admin/ManageUsers'
import PresenceDashboard from './pages/PresenceDashboard'

const AuthWrapper = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

const ChurchWrapper = () => {
  const { currentChurch, availableChurches } = useChurch()
  const { user } = useAuth()
  if (user?.role === 'admin') return <Outlet />
  if (!currentChurch && availableChurches.length <= 1)
    return <Navigate to="/select-church" replace />
  return <Outlet />
}

const AdminWrapper = () => {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

const App = () => (
  <AuthProvider>
    <ChurchProvider>
      <AppProvider>
        <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<AuthWrapper />}>
                <Route path="/select-church" element={<SelectChurch />} />
                <Route element={<ChurchWrapper />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/seeds" element={<Seeds />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/eventos" element={<Events />} />
                    <Route path="/eventos/:id" element={<EventDetail />} />
                    <Route path="/eventos/:id/check-in" element={<EventCheckIn />} />
                    <Route path="/dashboard-presenca" element={<PresenceDashboard />} />
                    <Route element={<AdminWrapper />}>
                      <Route path="/admin/churches" element={<ManageChurches />} />
                      <Route path="/admin/users" element={<ManageUsers />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </AppProvider>
    </ChurchProvider>
  </AuthProvider>
)

export default App
