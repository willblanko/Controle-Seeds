import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Calendar,
  Church,
  Activity,
  ArrowRight,
  UserPlus,
  CalendarDays,
  TrendingUp,
  CheckCircle,
  BarChart3,
} from 'lucide-react'
import { useChurch } from '@/contexts/church-context'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, Area, AreaChart } from 'recharts'

export function GlobalDashboard() {
  const { availableChurches, setCurrentChurch } = useChurch()
  const [seeds, setSeeds] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [fetchedSeeds, fetchedTeam, fetchedEvents, fetchedAttendances] = await Promise.all([
        pb.collection('seeds').getFullList(),
        pb.collection('team_members').getFullList(),
        pb.collection('events').getFullList(),
        pb.collection('attendances').getFullList(),
      ])
      setSeeds(fetchedSeeds)
      setTeamMembers(fetchedTeam)
      setEvents(fetchedEvents)
      setAttendances(fetchedAttendances)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('seeds', loadData)
  useRealtime('team_members', loadData)
  useRealtime('events', loadData)
  useRealtime('attendances', loadData)

  const nowString = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Global Metrics
  const totalSeeds = seeds.length
  const totalTeam = teamMembers.length
  const seedToTeamRatio = totalTeam > 0 ? (totalSeeds / totalTeam).toFixed(1) : totalSeeds
  const activeEvents = useMemo(
    () => events.filter((e) => e.date >= nowString).length,
    [events, nowString],
  )
  const totalPresent = useMemo(() => attendances.filter((a) => a.present).length, [attendances])

  // Charts Data
  const attendanceData = useMemo(() => {
    const pastEvents = [...events]
      .filter((e) => e.date < nowString)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)

    return pastEvents.map((event) => {
      const eventAttendances = attendances.filter((a) => a.event === event.id && a.present)
      return {
        name: event.title,
        date: new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        }),
        presentes: eventAttendances.length,
      }
    })
  }, [events, attendances, nowString])

  const growthData = useMemo(() => {
    const months = {} as Record<string, number>
    const sorted = [...seeds].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    )

    sorted.forEach((seed) => {
      const d = new Date(seed.created)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] || 0) + 1
    })

    let acc = 0
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        acc += count
        const [y, m] = key.split('-')
        return {
          month: `${m}/${y.slice(2)}`,
          total: acc,
        }
      })
  }, [seeds])

  const churchStats = useMemo(() => {
    return availableChurches
      .map((church) => {
        const churchSeeds = seeds.filter((s) => s.church === church.id).length
        const churchTeam = teamMembers.filter((t) => t.church === church.id).length
        return { ...church, totalSeeds: churchSeeds, teamCount: churchTeam }
      })
      .sort((a, b) => b.totalSeeds - a.totalSeeds)
  }, [availableChurches, seeds, teamMembers])

  const recentSeeds = useMemo(
    () =>
      [...seeds]
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
        .slice(0, 5),
    [seeds],
  )

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= nowString)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [events, nowString],
  )

  const getChurchName = useCallback(
    (id: string) => availableChurches.find((c) => c.id === id)?.name || 'Desconhecida',
    [availableChurches],
  )

  const chartConfigFrequency = {
    presentes: { label: 'Presenças', color: 'hsl(var(--primary))' },
  }

  const chartConfigGrowth = {
    total: { label: 'Total Ativos', color: 'hsl(var(--primary))' },
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const hasData = seeds.length > 0 || teamMembers.length > 0 || events.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-2">
          <Activity className="h-10 w-10 text-muted-foreground/60" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Nenhum dado disponível</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          O painel global agregará informações de todas as igrejas assim que existirem registros no
          sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Global</h2>
          <p className="text-muted-foreground">Métricas e acompanhamento de toda a igreja.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Seeds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeeds}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros no sistema</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Total</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeam}</div>
            <p className="text-xs text-muted-foreground mt-1">Líderes e membros de equipe</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Agendados futuramente</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Presenças</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPresent}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros consolidados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proporção Seed/Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seedToTeamRatio} : 1</div>
            <p className="text-xs text-muted-foreground mt-1">Seeds por membro de equipe</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Frequência em Eventos
            </CardTitle>
            <CardDescription>Presença consolidada nos últimos 10 eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ChartContainer config={chartConfigFrequency} className="h-[250px] w-full min-w-0">
                <BarChart accessibilityLayer data={attendanceData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="presentes" fill="var(--color-presentes)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                Nenhum evento passado encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Crescimento de Seeds
            </CardTitle>
            <CardDescription>Evolução acumulada de Seeds ativos ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ChartContainer config={chartConfigGrowth} className="h-[250px] w-full min-w-0">
                <AreaChart accessibilityLayer data={growthData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area
                    type="linear"
                    dataKey="total"
                    fill="var(--color-total)"
                    fillOpacity={0.2}
                    stroke="var(--color-total)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                Não há dados suficientes para o gráfico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Comparativo por Igreja</CardTitle>
            <CardDescription>Distribuição de Seeds ativos e membros da equipe.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Igreja</TableHead>
                    <TableHead className="text-right">Total de Seeds</TableHead>
                    <TableHead className="text-right">Equipe</TableHead>
                    <TableHead className="text-right">Proporção</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churchStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.name}</TableCell>
                      <TableCell className="text-right">{stat.totalSeeds}</TableCell>
                      <TableCell className="text-right">{stat.teamCount}</TableCell>
                      <TableCell className="text-right">
                        {stat.teamCount > 0
                          ? (stat.totalSeeds / stat.teamCount).toFixed(1)
                          : stat.totalSeeds}
                        :1
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentChurch(stat)}
                          title="Acessar painel da igreja"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {churchStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        Nenhuma igreja cadastrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Feed de Atividade
            </CardTitle>
            <CardDescription>Últimas novidades da rede</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[400px] px-6 pb-6">
              <div className="space-y-6">
                {recentSeeds.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <UserPlus className="h-4 w-4" /> Novos Seeds
                    </h4>
                    {recentSeeds.map((seed, i) => (
                      <div
                        key={`seed-${seed.id}`}
                        className="flex items-start gap-3 animate-fade-in-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={seed.photo} />
                          <AvatarFallback>{seed.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-none">{seed.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {getChurchName(seed.church)}
                            </Badge>
                            <span>{new Date(seed.created).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {upcomingEvents.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <CalendarDays className="h-4 w-4" /> Próximos Eventos
                    </h4>
                    {upcomingEvents.map((event, i) => (
                      <div
                        key={`event-${event.id}`}
                        className="flex items-start gap-3 animate-fade-in-up"
                        style={{ animationDelay: `${(i + recentSeeds.length) * 100}ms` }}
                      >
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border">
                          <Calendar className="h-4 w-4 text-foreground/70" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-none line-clamp-1">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {getChurchName(event.church)}
                            </Badge>
                            <span>
                              {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {recentSeeds.length === 0 && upcomingEvents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    Nenhuma atividade recente.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
