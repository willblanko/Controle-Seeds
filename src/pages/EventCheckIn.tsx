import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, CheckCircle } from 'lucide-react'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function EventCheckIn() {
  const { id } = useParams()
  const { events, seeds, attendances, toggleAttendance } = useApp()
  const { availableChurches } = useChurch()
  const [search, setSearch] = useState('')

  const event = events.find((e) => e.id === id)

  const eventSeeds = useMemo(() => {
    if (!event) return []
    const isGlobalEvent =
      !event.church || event.category === 'Camp' || event.category === 'Connection'

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
  }, [event, seeds, availableChurches])

  const filteredSeeds = eventSeeds.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar Seed por nome..."
            className="pl-9 h-12 text-base rounded-full bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filteredSeeds.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum seed encontrado.</div>
          ) : (
            filteredSeeds.map((seed) => {
              const isPresent = attendances.some(
                (a) => a.event === event.id && a.seed === seed.id && a.type === 'seed' && a.present,
              )

              return (
                <div
                  key={seed.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                  } cursor-pointer`}
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
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
