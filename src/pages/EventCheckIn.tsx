import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, CheckCircle, Users, Plus } from 'lucide-react'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
  const { events, seeds, attendances, toggleAttendance } = useApp()
  const { availableChurches } = useChurch()
  const [search, setSearch] = useState('')
  const [importSearch, setImportSearch] = useState('')
  const { toast } = useToast()

  const event = events.find((e) => e.id === id)

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

    const isGlobalEvent = !event.church || event.category === 'Connection'

    const validChurchIds = isGlobalEvent
      ? availableChurches.map((c) => c.id)
      : ([event.church].filter(Boolean) as string[])

    if (!isGlobalEvent) {
      const guestIds = availableChurches
        .filter((c) => (c as any).event_host === event.church)
        .map((c) => c.id)
      validChurchIds.push(...guestIds)
    }

    return seeds.filter((s) => validChurchIds.includes(s.church))
  }, [event, seeds, availableChurches, attendances, isCamp])

  const filteredSeeds = eventSeeds.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

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
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao importar participante.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTalent = async (attId: string, field: string, value: any) => {
    try {
      await pb.collection('attendances').update(attId, { [field]: value })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar dados.', variant: 'destructive' })
    }
  }

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
              Marque a presença dos Seeds rapidamente.
            </p>
          </div>
        </div>

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
                                {availableChurches.find((c) => c.id === s.church)?.name || 'Global'}
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
            <div className="text-center py-10 text-muted-foreground">
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
                    onClick={() => toggleAttendance(event.id, seed.id, 'seed')}
                  >
                    <div>
                      <p className="font-semibold text-base">{seed.name}</p>
                      <p className="text-sm text-muted-foreground">Resp: {seed.guardian1}</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={isPresent}
                        onCheckedChange={() => toggleAttendance(event.id, seed.id, 'seed')}
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
                              handleUpdateTalent(attendance.id, 'talent_details', e.target.value)
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
      </div>
    </div>
  )
}
