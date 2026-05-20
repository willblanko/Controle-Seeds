import { Users, Calendar as CalendarIcon, CheckCircle, Cake, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const { seeds, events, attendances } = useApp()
  const { currentChurch } = useChurch()
  const { user } = useAuth()

  const isGlobalAdmin = user?.role === 'admin' && !currentChurch

  const filteredSeeds = seeds.filter((s) => (isGlobalAdmin ? true : s.church === currentChurch?.id))
  const filteredEvents = events.filter((e) =>
    isGlobalAdmin ? true : e.church === currentChurch?.id,
  )
  const filteredAttendances = attendances

  const activeSeeds = filteredSeeds.filter((s) => s.status === 'Ativo').length

  const nowString = new Date().toISOString().split('T')[0]
  const upcomingEvents = filteredEvents.filter((e) => e.date >= nowString)
  const pastEvents = filteredEvents
    .filter((e) => e.date < nowString)
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalPossible = pastEvents.length * activeSeeds
  const actuallyPresent = filteredAttendances.filter(
    (a) => a.present && a.type === 'seed' && pastEvents.find((e) => e.id === a.event),
  ).length
  const avgAttendance = totalPossible > 0 ? Math.round((actuallyPresent / totalPossible) * 100) : 0

  const lastEvent = pastEvents
    .slice()
    .reverse()
    .find((e) => {
      const cat = e.category.toLowerCase()
      return cat !== 'reunião' && cat !== 'reuniao'
    })

  // Logic for seeds turning 14 in the next 180 days
  const nowObj = new Date()
  nowObj.setHours(0, 0, 0, 0)
  const in180Days = new Date(nowObj.getTime() + 180 * 24 * 60 * 60 * 1000)

  const turning14Seeds = filteredSeeds
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
  const birthdaysThisMonth = filteredSeeds
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
            <p className="text-xs text-muted-foreground mt-1">Seeds matriculados</p>
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
            <CardTitle>Último Evento</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] flex flex-col">
            {lastEvent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-secondary/20 rounded-xl p-8 border border-secondary/50">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                  <CalendarIcon className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold tracking-tight">{lastEvent.title}</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">
                      {lastEvent.category}
                    </Badge>
                    <span>•</span>
                    <span>
                      {new Date(lastEvent.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-sm pt-4 border-t border-border/50">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Presenças (Seeds)</p>
                    <p className="text-4xl font-bold text-foreground">
                      {
                        filteredAttendances.filter(
                          (a) => a.event === lastEvent.id && a.present && a.type === 'seed',
                        ).length
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Presenças (Equipe)</p>
                    <p className="text-4xl font-bold text-foreground">
                      {
                        filteredAttendances.filter(
                          (a) => a.event === lastEvent.id && a.present && a.type === 'team',
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                Nenhum evento recente encontrado
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
                    Nenhum Seed completará 14 anos nos próximos 6 meses.
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
                          {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')} -{' '}
                          {event.category}
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
