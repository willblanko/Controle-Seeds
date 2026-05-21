import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2, Eye } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useChurch } from '@/contexts/church-context'
import pb from '@/lib/pocketbase/client'
import { ChurchSelector } from '@/components/church-selector'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EventForm } from '@/components/event-form'

export default function Events() {
  const { currentChurch, availableChurches } = useChurch()
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const data = await pb.collection('events').getFullList()
      setEvents(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEvents = useMemo(() => {
    const validChurchIds = currentChurch ? [currentChurch.id] : []
    if (currentChurch) {
      const guestIds = availableChurches
        .filter((c: any) => c.event_host === currentChurch.id)
        .map((c: any) => c.id)
      validChurchIds.push(...guestIds)
    }

    return events
      .filter((e) => {
        const matchChurch = validChurchIds.includes(e.church) || e.category === 'Camp'
        if (!matchChurch) return false
        return e.title.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, search, currentChurch, availableChurches])

  const futureEvents = filteredEvents.filter(
    (e) => new Date(e.date + 'T12:00:00') >= new Date(new Date().setHours(0, 0, 0, 0)),
  )
  const pastEvents = filteredEvents
    .filter((e) => new Date(e.date + 'T12:00:00') < new Date(new Date().setHours(0, 0, 0, 0)))
    .reverse()

  const handleCreate = async (data: any) => {
    if (!currentChurch && data.category !== 'Camp') {
      toast({ title: 'Erro', description: 'Selecione uma igreja.', variant: 'destructive' })
      return
    }
    try {
      await pb.collection('events').create({
        ...data,
        church: currentChurch?.id || '',
      })
      await loadData()
      setIsCreateOpen(false)
      toast({ title: 'Evento criado.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const renderEventRow = (event: any) => {
    const isFuture = new Date(event.date + 'T12:00:00') >= new Date(new Date().setHours(0, 0, 0, 0))
    return (
      <TableRow key={event.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isFuture ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div className="font-semibold">{event.title}</div>
          </div>
        </TableCell>
        <TableCell>{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
        <TableCell>
          <Badge variant="outline">{event.category}</Badge>
        </TableCell>
        <TableCell className="text-right space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/eventos/${event.id}`)}>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={async () => {
              await pb.collection('events').delete(event.id)
              loadData()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Planeje e acompanhe os eventos da igreja.</p>
        </div>
        <div className="flex items-center gap-2">
          <ChurchSelector allowGlobal={false} />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span>Novo Evento</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <EventForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evento..."
            className="pl-9 bg-card shadow-sm h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="future">Próximos</TabsTrigger>
          <TabsTrigger value="past">Passados</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="border rounded-md bg-card p-4">
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const dayEvents = filteredEvents.slice(i, i + 1) // Simplified calendar logic for demo
              return (
                <div key={i} className="bg-background p-2 min-h-[100px] border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">{i + 1}</div>
                  <div className="flex flex-col gap-1">
                    {filteredEvents.map((e) => {
                      const d = new Date(e.date + 'T12:00:00')
                      if (d.getDate() === i + 1) {
                        const isFuture = d >= new Date(new Date().setHours(0, 0, 0, 0))
                        return (
                          <div
                            key={e.id}
                            onClick={() => navigate(`/eventos/${e.id}`)}
                            className={`text-[10px] p-1 rounded cursor-pointer truncate text-white ${isFuture ? 'bg-green-600' : 'bg-gray-500'}`}
                          >
                            {e.title}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="future">
          <div className="rounded-md border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhum evento próximo.
                    </TableCell>
                  </TableRow>
                ) : (
                  futureEvents.map(renderEventRow)
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="rounded-md border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhum evento passado.
                    </TableCell>
                  </TableRow>
                ) : (
                  pastEvents.map(renderEventRow)
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
