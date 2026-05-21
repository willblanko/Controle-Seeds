import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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
  const [currentDate, setCurrentDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const { toast } = useToast()
  const navigate = useNavigate()

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

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
        const isGlobal = e.category === 'Camp' || e.category === 'Connection' || !e.church
        const matchChurch = isGlobal || validChurchIds.includes(e.church)
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
    const isGlobal = data.category === 'Camp' || data.category === 'Connection'
    if (!currentChurch && !isGlobal) {
      toast({ title: 'Erro', description: 'Selecione uma igreja.', variant: 'destructive' })
      return
    }
    try {
      await pb.collection('events').create({
        ...data,
        church: isGlobal ? '' : currentChurch?.id || '',
      })
      await loadData()
      setIsCreateOpen(false)
      toast({ title: 'Evento criado.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const getEventColor = (e: any) => {
    if (e.category === 'Camp') return 'bg-orange-500'
    if (e.category === 'Connection') return 'bg-blue-500'
    const isFuture = new Date(e.date + 'T12:00:00') >= new Date(new Date().setHours(0, 0, 0, 0))
    return isFuture ? 'bg-green-600' : 'bg-gray-500'
  }

  const renderEventRow = (event: any) => {
    const isFuture = new Date(event.date + 'T12:00:00') >= new Date(new Date().setHours(0, 0, 0, 0))
    return (
      <TableRow key={event.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getEventColor(event)}`} />
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

        {currentChurch && (
          <div className="flex flex-col sm:flex-row gap-4 mb-2 mt-4">
            <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-3 rounded-lg flex-1 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
              <div className="text-sm font-semibold mb-1">Cultos Realizados (Ano Atual)</div>
              <div className="text-2xl font-bold">
                {
                  pastEvents.filter(
                    (e) =>
                      e.category === 'Culto' &&
                      e.church === currentChurch.id &&
                      new Date(e.date).getFullYear() === new Date().getFullYear(),
                  ).length
                }
              </div>
            </div>
            <div className="bg-orange-50 text-orange-800 border border-orange-200 px-4 py-3 rounded-lg flex-1 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300">
              <div className="text-sm font-semibold mb-1">Hangouts Realizados (Ano Atual)</div>
              <div className="text-2xl font-bold">
                {
                  pastEvents.filter(
                    (e) =>
                      e.category === 'Hangout' &&
                      e.church === currentChurch.id &&
                      new Date(e.date).getFullYear() === new Date().getFullYear(),
                  ).length
                }
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="future">Próximos</TabsTrigger>
          <TabsTrigger value="past">Passados</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="border rounded-md bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-lg">
              {currentDate
                .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
            {(() => {
              const daysInMonth = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0,
              ).getDate()
              const firstDayOfMonth = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1,
              ).getDay()
              const weeks = Math.ceil((daysInMonth + firstDayOfMonth) / 7)

              return Array.from({ length: weeks * 7 }).map((_, i) => {
                const dayNumber = i - firstDayOfMonth + 1
                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth
                const currentCellDate = isCurrentMonth
                  ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
                  : null

                return (
                  <div
                    key={i}
                    className={`bg-background p-2 min-h-[100px] border-t border-border ${!isCurrentMonth ? 'opacity-30 bg-muted/50' : ''}`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {isCurrentMonth ? dayNumber : ''}
                    </div>
                    <div className="flex flex-col gap-1">
                      {isCurrentMonth &&
                        filteredEvents.map((e) => {
                          const d = new Date(e.date + 'T12:00:00')
                          const isMatch =
                            d.getDate() === dayNumber &&
                            d.getMonth() === currentDate.getMonth() &&
                            d.getFullYear() === currentDate.getFullYear()

                          let isRangeMatch = false
                          if (e.category === 'Camp' && e.endDate) {
                            const start = new Date(e.date + 'T12:00:00')
                            const end = new Date(e.endDate + 'T12:00:00')
                            const cell = new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth(),
                              dayNumber,
                              12,
                              0,
                              0,
                            )
                            isRangeMatch = cell >= start && cell <= end
                          }

                          if (isMatch || isRangeMatch) {
                            return (
                              <div
                                key={`${e.id}-${dayNumber}`}
                                onClick={() => navigate(`/eventos/${e.id}`)}
                                className={`text-[10px] p-1 rounded cursor-pointer truncate text-white ${getEventColor(e)}`}
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
              })
            })()}
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
