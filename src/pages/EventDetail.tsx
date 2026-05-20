import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, CalendarDays } from 'lucide-react'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function EventDetail() {
  const { id } = useParams()
  const { events, seeds, teamMembers, attendances, toggleAttendance } = useApp()
  const { availableChurches } = useChurch()
  const { toast } = useToast()

  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Button asChild>
          <Link to="/eventos">Voltar para Eventos</Link>
        </Button>
      </div>
    )
  }

  const validChurchIds = [event.church].filter(Boolean) as string[]
  const guestIds = availableChurches
    .filter((c) => (c as any).event_host === event.church)
    .map((c) => c.id)
  validChurchIds.push(...guestIds)

  const activeSeeds = seeds.filter((s) => s.status === 'Ativo' && validChurchIds.includes(s.church))
  const eventTeamMembers = teamMembers.filter((m) => validChurchIds.includes(m.church))

  const presentSeedsCount = attendances.filter(
    (a) => a.event === id && a.type === 'seed' && a.present,
  ).length
  const presentTeamCount = attendances.filter(
    (a) => a.event === id && a.type === 'team' && a.present,
  ).length

  const handleSaveNotes = () => {
    toast({
      title: 'Anotações salvas',
      description: 'Suas observações foram registradas com sucesso.',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
        >
          <Link to="/eventos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Eventos
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{event.title}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />{' '}
            {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" /> {event.time}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> {event.location}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle>Aba de Presença</CardTitle>
                <CardDescription>
                  Marque a participação da equipe e dos Seeds neste evento.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="seeds" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="seeds" className="gap-2">
                    Seeds{' '}
                    <Badge variant="secondary" className="ml-1 rounded-full">
                      {presentSeedsCount}/{activeSeeds.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="team" className="gap-2">
                    Equipe{' '}
                    <Badge variant="secondary" className="ml-1 rounded-full">
                      {presentTeamCount}/{eventTeamMembers.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="seeds" className="space-y-3 mt-4">
                  {activeSeeds.map((seed, i) => {
                    const isPresent = attendances.some(
                      (a) =>
                        a.event === event.id &&
                        a.seed === seed.id &&
                        a.type === 'seed' &&
                        a.present,
                    )
                    return (
                      <div
                        key={seed.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors animate-fade-in ${
                          isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                        }`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div>
                          <p className="font-medium text-sm">{seed.name}</p>
                          <p className="text-xs text-muted-foreground">Contato: {seed.guardian1}</p>
                        </div>
                        <Switch
                          checked={isPresent}
                          onCheckedChange={() => toggleAttendance(event.id, seed.id, 'seed')}
                          aria-label={`Marcar presença para o Seed ${seed.name}`}
                        />
                      </div>
                    )
                  })}
                  {activeSeeds.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      Nenhum Seed ativo para marcar presença.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="team" className="space-y-3 mt-4">
                  {eventTeamMembers.map((member, i) => {
                    const isPresent = attendances.some(
                      (a) =>
                        a.event === event.id &&
                        a.team_member === member.id &&
                        a.type === 'team' &&
                        a.present,
                    )
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors animate-fade-in ${
                          isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                        }`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        <Switch
                          checked={isPresent}
                          onCheckedChange={() => toggleAttendance(event.id, member.id, 'team')}
                          aria-label={`Marcar presença para o membro ${member.name}`}
                        />
                      </div>
                    )
                  })}
                  {eventTeamMembers.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      Nenhum membro da equipe cadastrado.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4">{event.description}</p>
              <div className="inline-flex items-center justify-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                Categoria: {event.category}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Anotações</CardTitle>
              <CardDescription>Observações gerais da atividade.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Como foi o evento? Algum destaque importante?"
                className="min-h-[120px] resize-none mb-4"
              />
              <Button className="w-full" onClick={handleSaveNotes}>
                Salvar Anotações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
