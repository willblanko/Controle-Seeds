import { useState, useEffect } from 'react'
import { Users, Calendar, Church, Activity, ArrowRight, UserPlus, CalendarDays } from 'lucide-react'
import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function GlobalDashboard() {
  const { seeds, events } = useApp()
  const { availableChurches, setCurrentChurch } = useChurch()
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const fetchTeamMembers = async () => {
    try {
      const records = await pb.collection('team_members').getFullList()
      setTeamMembers(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  useRealtime('team_members', () => {
    fetchTeamMembers()
  })

  const churchStats = availableChurches
    .map((church) => {
      const churchSeeds = seeds.filter((s) => s.church === church.id && s.status === 'Ativo').length
      const churchTeam = teamMembers.filter((t) => t.church === church.id).length
      return { ...church, activeSeeds: churchSeeds, teamCount: churchTeam }
    })
    .sort((a, b) => b.activeSeeds - a.activeSeeds)

  const recentSeeds = [...seeds]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 5)

  const nowString = new Date().toISOString().split('T')[0]
  const upcomingEvents = [...events]
    .filter((e) => e.date >= nowString)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const getChurchName = (id: string) =>
    availableChurches.find((c) => c.id === id)?.name || 'Desconhecida'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Global</h2>
          <p className="text-muted-foreground">Métricas e acompanhamento de todas as igrejas.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Seeds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seeds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sendo {seeds.filter((s) => s.status === 'Ativo').length} ativos
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Voluntários e líderes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Eventos registrados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Igrejas</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableChurches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades ativas</p>
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
                    <TableHead className="text-right">Seeds Ativos</TableHead>
                    <TableHead className="text-right">Equipe</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churchStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.name}</TableCell>
                      <TableCell className="text-right">{stat.activeSeeds}</TableCell>
                      <TableCell className="text-right">{stat.teamCount}</TableCell>
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
                        Nenhuma igreja encontrada.
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
