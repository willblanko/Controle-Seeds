import { Users, Calendar as CalendarIcon, CheckCircle, Cake, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Index() {
  const { seeds, events, attendances } = useApp()

  const activeSeeds = seeds.filter((s) => s.status === 'Ativo').length

  const nowString = new Date().toISOString().split('T')[0]
  const upcomingEvents = events.filter((e) => e.date >= nowString)
  const pastEvents = events
    .filter((e) => e.date < nowString)
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalPossible = pastEvents.length * activeSeeds
  const actuallyPresent = attendances.filter(
    (a) => a.present && pastEvents.find((e) => e.id === a.eventId),
  ).length
  const avgAttendance = totalPossible > 0 ? Math.round((actuallyPresent / totalPossible) * 100) : 0

  const chartData = pastEvents.slice(-5).map((event) => {
    const eventAttendances = attendances.filter((a) => a.eventId === event.id && a.present).length
    return {
      name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
      taxa: activeSeeds > 0 ? Math.round((eventAttendances / activeSeeds) * 100) : 0,
    }
  })

  // Logic for seeds turning 14 in the next 180 days
  const nowObj = new Date()
  nowObj.setHours(0, 0, 0, 0)
  const in180Days = new Date(nowObj.getTime() + 180 * 24 * 60 * 60 * 1000)

  const turning14Seeds = seeds
    .map((seed) => {
      const bdParts = seed.birthDate.split('-')
      const bYear = parseInt(bdParts[0])
      const bMonth = parseInt(bdParts[1]) - 1
      const bDay = parseInt(bdParts[2])
      const fourteenthBday = new Date(bYear + 14, bMonth, bDay)

      return {
        ...seed,
        fourteenthBday,
      }
    })
    .filter((seed) => seed.fourteenthBday >= nowObj && seed.fourteenthBday <= in180Days)
    .sort((a, b) => a.fourteenthBday.getTime() - b.fourteenthBday.getTime())

  const currentMonth = nowObj.getMonth() + 1
  const birthdaysThisMonth = seeds
    .filter((seed) => seed.status === 'Ativo')
    .filter((seed) => {
      const bdParts = seed.birthDate.split('-')
      const bMonth = parseInt(bdParts[1], 10)
      return bMonth === currentMonth
    })
    .sort((a, b) => {
      const aDay = parseInt(a.birthDate.split('-')[2], 10)
      const bDay = parseInt(b.birthDate.split('-')[2], 10)
      return aDay - bDay
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do acompanhamento das Seeds.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/seeds">Gerenciar Seeds</Link>
          </Button>
          <Button asChild>
            <Link to="/eventos">Novo Evento</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Seeds Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSeeds}</div>
            <p className="text-xs text-muted-foreground mt-1">Alunos matriculados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Agendados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Presença</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}%</div>
            <p className="text-xs text-muted-foreground mt-1">Nos eventos passados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Taxa de Presença (%)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {chartData.length > 0 ? (
              <ChartContainer
                config={{ taxa: { label: 'Presença', color: 'hsl(var(--primary))' } }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="taxa"
                      fill="var(--color-taxa)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Aniversariantes do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {birthdaysThisMonth.map((seed, i) => (
                  <div
                    key={seed.id}
                    className="flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={seed.photo} />
                      <AvatarFallback>{seed.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{seed.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Dia {parseInt(seed.birthDate.split('-')[2], 10)}
                      </p>
                    </div>
                  </div>
                ))}
                {birthdaysThisMonth.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Nenhum aniversariante este mês.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Cake className="h-4 w-4" />
                Próximos a completar 14 anos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turning14Seeds.map((seed, i) => (
                  <div
                    key={seed.id}
                    className="flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={seed.photo} />
                      <AvatarFallback>{seed.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{seed.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Aniversário em: {seed.fourteenthBday.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
                {turning14Seeds.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Nenhum seed completará 14 anos nos próximos 6 meses.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastEvents
                  .slice(-3)
                  .reverse()
                  .map((event, i) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 animate-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3.5 w-3.5 text-foreground/70" />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('pt-BR')} - {event.category}
                        </p>
                      </div>
                    </div>
                  ))}
                {pastEvents.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Nenhum evento passado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
