import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { GlobalDashboard } from '@/components/dashboard/GlobalDashboard'
import { ChurchDashboard } from '@/components/dashboard/ChurchDashboard'

export default function Index() {
  const { currentChurch } = useChurch()
  const { user } = useAuth()

  const isGlobalAdmin = user?.role === 'admin' && !currentChurch

  if (isGlobalAdmin) {
    return <GlobalDashboard />
  }

  return <ChurchDashboard />
}
