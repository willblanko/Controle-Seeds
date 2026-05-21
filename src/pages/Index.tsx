import { useChurch } from '@/contexts/church-context'
import { GlobalDashboard } from '@/components/dashboard/GlobalDashboard'
import { ChurchDashboard } from '@/components/dashboard/ChurchDashboard'
import { ChurchSelector } from '@/components/church-selector'

export default function Index() {
  const { currentChurch } = useChurch()

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <ChurchSelector allowGlobal={true} />
      </div>
      {currentChurch ? <ChurchDashboard /> : <GlobalDashboard />}
    </div>
  )
}
