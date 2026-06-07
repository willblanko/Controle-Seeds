import { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, CheckCircle, Users, Plus, UserPlus, Info } from 'lucide-react'

import { useChurch } from '@/contexts/church-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import pb from '@/lib/pocketbase/client'

export default function EventCheckIn() {
  const { id } = useParams()
  const { availableChurches } = useChurch()
  const [search, setSearch] = useState('')
  const [importSearch, setImportSearch] = useState('')
  const { toast } = useToast()

  const [event, setEvent] = useState<any>(null)
  const [seeds, setSeeds] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])
  const [visitorName, setVisitorName] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!id) return
    try {
      const ev = await pb.collection('events').getOne(id)
      setEvent(ev)

      const isGlobalEvent = ev.category === 'Connection' || ev.category === 'Camp'

      let seedsData: any[] = []
      let teamData: any[] = []

      if (ev.category === 'Camp') {
        seedsData = await pb.collection('seeds').getFullList()
        teamData = await pb.collection('team_members').getFullList()
      } else if (ev.church) {
        // Fetch only related church records efficiently
        const filterStr = `church='${ev.church}'`

        // Check if there are guest churches
        const guestIds = availableChurches
          .filter((c) => (c as any).event_host === ev.church)
          .map((c) => c.id)

        let finalFilter = filterStr
        if (guestIds.length > 0) {
          const guestFilter = guestIds.map((gId) => `church='${gId}'`).join(' || ')
          finalFilter = `(${filterStr} || ${guestFilter})`
        }

        seedsData = await pb.collection('seeds').getFullList({ filter: finalFilter })
        teamData = await pb.collection('team_members').getFullList({ filter: finalFilter })
      } else if (isGlobalEvent) {
        seedsData = await pb.collection('seeds').getFullList()
        teamData = await pb.collection('team_members').getFullList()
      }

      setSeeds(seedsData)
      setTeamMembers(teamData)

      const atts = await pb.collection('attendances').getFullList({
        filter: `event='${id}'`,
      })
      setAttendances(atts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, availableChurches])

  const isCamp = event?.category === 'Camp'
  const isTalentShow = event?.category === 'Show de talentos'

  const eventSeeds = useMemo(() => {
    if (!event) return []
    if (isCamp) {
      const importedIds = attendances
        .filter((a) => a.event === event.id && a.type === 'seed')
        .map((a) => a.seed)
      return seeds.filter((s) => importedIds.includes(s.id))
    }
    return seeds
  }, [event, seeds, attendances, isCamp])

  const filteredSeeds = eventSeeds.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredTeam = teamMembers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )

  const visitorAttendances = attendances.filter((a) => a.type === 'visitor')

  const allOtherSeeds = seeds.filter((s) => !eventSeeds.some((es) => es.id === s.id))
  const filteredImportSeeds = allOtherSeeds.filter((s) =>
    s.name.toLowerCase().includes(importSearch.toLowerCase()),
  )

  const handleImportSeed = async (seedId: string) => {
    if (!event) return
    try {
      await pb.collection('attendances').create({
        event: event.id,
        seed: seedId,
        type: 'seed',
        present: false,
      })
      toast({ title: 'Sucesso', description: 'Participante importado com sucesso!' })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao importar participante.',
        variant: 'destructive',
      })
    }
  }

  const toggleAttendance = async (entityId: string, type: 'seed' | 'team') => {
    if (!event) return
    const attendance = attendances.find(
      (a) =>
        a.event === event.id &&
        a[type === 'seed' ? 'seed' : 'team_member'] === entityId &&
        a.type === type,
    )

    try {
      if (attendance) {
        await pb.collection('attendances').update(attendance.id, {
          present: !attendance.present,
        })
      } else {
        await pb.collection('attendances').create({
          event: event.id,
          [type === 'seed' ? 'seed' : 'team_member']: entityId,
          type,
          present: true,
        })
      }
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar presença.', variant: 'destructive' })
    }
  }

  const handleAddVisitor = async () => {
    if (!visitorName.trim() || !event) return
    try {
      await pb.collection('attendances').create({
        event: event.id,
        type: 'visitor',
        visitor_name: visitorName,
        present: true,
      })
      toast({ title: 'Visitante adicionado e marcado como presente.' })
      setVisitorName('')
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleUpdateTalent = async (attId: string, field: string, value: any) => {
    try {
      await pb.collection('attendances').update(attId, { [field]: value })
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar dados.', variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold mb-4">Evento não encontrado</h2>
        <Button asChild>
          <Link to="/eventos">Voltar</Link>
        </Button>
      </div>
    )
  }

  if (!event.church && event.category !== 'Camp' && event.category !== 'Connection') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto p-4">
        <Info className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sem igreja associada</h2>
        <p className="text-muted-foreground mb-6">
          Nenhum membro pode ser listado porque nenhuma igreja está atribuída a este evento.
        </p>
        <Button asChild>
          <Link to={`/eventos/${event.id}`}>Voltar para o Evento</Link>
        </Button>
      </div>
    )
  }

  if (event.completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Evento Concluído</h2>
        <p className="text-muted-foreground mb-6">
          O check-in não está mais disponível pois este evento já foi marcado como concluído.
        </p>
        <Button asChild>
          <Link to={`/eventos/${event.id}`}>Ver Detalhes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-y-6 pb-20 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 border-b pb-4 mt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/eventos/${event.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Check-in: {event.title}</h1>
            <p className="text-sm text-muted-foreground">
              Marque a presença da igreja rapidamente.
            </p>
          </div>
        </div>

        <Tabs defaultValue="seeds" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="seeds">Seeds</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="visitors">Visitantes</TabsTrigger>
          </TabsList>

          <TabsContent value="seeds" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar Seed por nome..."
                  className="pl-9 h-12 text-base rounded-full bg-card"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isCamp && !event.completed && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto h-12 rounded-full shrink-0">
                      <Users className="mr-2 h-4 w-4" /> Importar Participantes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Importar Participantes (Camp)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Buscar em todos os Seeds..."
                        value={importSearch}
                        onChange={(e) => setImportSearch(e.target.value)}
                      />
                      <ScrollArea className="h-[300px] border rounded-md p-2">
                        {filteredImportSeeds.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">
                            Nenhum seed disponível para importar.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {filteredImportSeeds.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                              >
                                <div>
                                  <p className="text-sm font-medium">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {availableChurches.find((c) => c.id === s.church)?.name ||
                                      'Global'}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleImportSeed(s.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-2">
              {filteredSeeds.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                  {isCamp
                    ? 'Nenhum participante importado. Use o botão acima.'
                    : 'Nenhum seed encontrado.'}
                </div>
              ) : (
                filteredSeeds.map((seed) => {
                  const attendance = attendances.find(
                    (a) => a.event === event.id && a.seed === seed.id && a.type === 'seed',
                  )
                  const isPresent = attendance?.present || false

                  return (
                    <div
                      key={seed.id}
                      className={`flex flex-col p-4 rounded-xl border transition-colors ${
                        isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                      }`}
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleAttendance(seed.id, 'seed')}
                      >
                        <div>
                          <p className="font-semibold text-base">{seed.name}</p>
                          <p className="text-sm text-muted-foreground">Resp: {seed.guardian1}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={isPresent}
                            onCheckedChange={() => toggleAttendance(seed.id, 'seed')}
                            className="scale-125"
                          />
                        </div>
                      </div>

                      {isTalentShow && isPresent && attendance && (
                        <div className="mt-4 pt-4 border-t border-primary/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary">
                              Participante do Show?
                            </span>
                            <Switch
                              checked={attendance.is_participant || false}
                              onCheckedChange={(val) =>
                                handleUpdateTalent(attendance.id, 'is_participant', val)
                              }
                            />
                          </div>
                          {attendance.is_participant && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                Qual o talento?
                              </label>
                              <Input
                                placeholder="Ex: Canto, Dança, Mágica..."
                                defaultValue={attendance.talent_details || ''}
                                onBlur={(e) =>
                                  handleUpdateTalent(
                                    attendance.id,
                                    'talent_details',
                                    e.target.value,
                                  )
                                }
                                className="bg-background"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar membro da equipe..."
                className="pl-9 h-12 text-base rounded-full bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {filteredTeam.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                  Nenhum membro da equipe encontrado.
                </div>
              ) : (
                filteredTeam.map((member) => {
                  const attendance = attendances.find(
                    (a) => a.event === event.id && a.team_member === member.id && a.type === 'team',
                  )
                  const isPresent = attendance?.present || false

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                        isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                      }`}
                      onClick={() => toggleAttendance(member.id, 'team')}
                    >
                      <div>
                        <p className="font-semibold text-base">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isPresent}
                          onCheckedChange={() => toggleAttendance(member.id, 'team')}
                          className="scale-125"
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Adicionar Visitante</h3>
              <p className="text-sm text-muted-foreground">
                Registre rapidamente um visitante não cadastrado no sistema.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Nome do visitante..."
                  className="h-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddVisitor()
                  }}
                />
                <Button onClick={handleAddVisitor} className="h-12 px-6 gap-2 shrink-0">
                  <UserPlus className="w-4 h-4" /> Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold px-1 text-sm text-muted-foreground uppercase tracking-wider">
                Visitantes Registrados
              </h4>
              {visitorAttendances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  Nenhum visitante registrado.
                </div>
              ) : (
                visitorAttendances.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-primary/5 border-primary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-semibold text-base">{a.visitor_name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={async () => {
                        try {
                          await pb.collection('attendances').delete(a.id)
                          loadData()
                        } catch (e) {
                          toast({ title: 'Erro', variant: 'destructive' })
                        }
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
