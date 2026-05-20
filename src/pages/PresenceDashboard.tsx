import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function PresenceDashboard() {
  const { events, attendances, seeds } = useApp()
  const { currentChurch, availableChurches } = useChurch()
  const { user } = useAuth()

  const isGlobalAdmin = user?.role === 'admin' && !currentChurch

  const validChurchIds = [currentChurch?.id].filter(Boolean) as string[]
  if (currentChurch) {
    const guestIds = availableChurches
      .filter((c) => (c as any).event_host === currentChurch.id)
      .map((c) => c.id)
    validChurchIds.push(...guestIds)
  }

  // Exclude "Reunião" type events and past events only
  const now = new Date().toISOString().split('T')[0]
  const validEvents = events
    .filter(
      (e) =>
        e.date < now &&
        e.category.toLowerCase() !== 'reunião' &&
        e.category.toLowerCase() !== 'reuniao' &&
        (isGlobalAdmin ? true : e.church === currentChurch?.id),
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const activeSeeds = seeds.filter(
    (s) => s.status === 'Ativo' && (isGlobalAdmin ? true : validChurchIds.includes(s.church)),
  ).length

  const chartData = validEvents.map((event) => {
    const presentSeeds = attendances.filter(
      (a) => a.event === event.id && a.type === 'seed' && a.present,
    ).length
    const presentTeam = attendances.filter(
      (a) => a.event === event.id && a.type === 'team' && a.present,
    ).length
    return {
      name: event.title,
      date: event.date,
      seeds: presentSeeds,
      team: presentTeam,
    }
  })

  const totalPossible = validEvents.length * activeSeeds
  const totalActual = chartData.reduce((acc, curr) => acc + curr.seeds, 0)
  const percentage = totalPossible > 0 ? Math.round((totalActual / totalPossible) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard de Presença</h2>
        <p className="text-muted-foreground">
          Análise de participação nos eventos (excluindo reuniões).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média de Presença (Seeds)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentage}%</div>
            <p className="text-xs text-muted-foreground">Dos seeds ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eventos Analisados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validEvents.length}</div>
            <p className="text-xs text-muted-foreground">Eventos passados válidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presença por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                seeds: { label: 'Seeds', color: 'hsl(var(--primary))' },
                team: { label: 'Equipe', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[400px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="seeds" fill="var(--color-seeds)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="team" fill="var(--color-team)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              Sem dados suficientes para exibir o gráfico.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
