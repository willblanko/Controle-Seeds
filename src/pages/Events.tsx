import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  MapPin,
  Clock,
  CalendarDays,
  MoreVertical,
  Pencil,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

const eventSchema = z
  .object({
    title: z.string().min(3, 'Título obrigatório'),
    description: z.string().min(5, 'Descrição obrigatória'),
    date: z.string().min(10, 'Data obrigatória'),
    endDate: z.string().optional(),
    time: z.string().min(4, 'Horário obrigatório'),
    location: z.string().min(3, 'Local obrigatório'),
    category: z.string().min(1, 'Categoria obrigatória'),
  })
  .refine(
    (data) => {
      if (data.category === 'Camp' && !data.endDate) return false
      return true
    },
    { message: 'Data de término obrigatória para Camp', path: ['endDate'] },
  )

export default function Events() {
  const { events, addEvent } = useApp()
  const { currentChurch, availableChurches } = useChurch()
  const { user } = useAuth()
  const { toast } = useToast()
  const [openNew, setOpenNew] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [calendarChurch, setCalendarChurch] = useState<string>('')

  useEffect(() => {
    if (availableChurches.length > 0 && !calendarChurch) {
      setCalendarChurch(availableChurches[0].id)
    }
  }, [availableChurches, calendarChurch])

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      endDate: '',
      time: '',
      location: '',
      category: '',
    },
  })

  useEffect(() => {
    if (editingEvent && openEdit) {
      form.reset({
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        endDate: editingEvent.endDate || '',
        time: editingEvent.time,
        location: editingEvent.location,
        category: editingEvent.category,
      })
    }
  }, [editingEvent, openEdit, form])

  async function onSubmit(data: z.infer<typeof eventSchema>) {
    if (data.category !== 'Camp') {
      data.endDate = ''
    }

    const [y, m, d] = data.date.split('-')
    const dateSuffix = `${d}/${m}/${y}`
    let finalSuffix = dateSuffix

    if (data.category === 'Camp' && data.endDate) {
      const [ey, em, ed] = data.endDate.split('-')
      finalSuffix = `${dateSuffix} a ${ed}/${em}/${ey}`
    }

    let finalTitle = data.title.trim()
    finalTitle = finalTitle.replace(
      /\s*-\s*\d{2}\/\d{2}\/\d{4}(?:\s*a\s*\d{2}\/\d{2}\/\d{4})?$/,
      '',
    )
    finalTitle = `${finalTitle} - ${finalSuffix}`

    const finalData = { ...data, title: finalTitle }

    if (editingEvent) {
      try {
        await pb.collection('events').update(editingEvent.id, finalData)
        toast({ title: 'Sucesso', description: 'Evento atualizado com sucesso!' })
        setOpenEdit(false)
        setEditingEvent(null)
        setTimeout(() => window.location.reload(), 500)
      } catch (e: any) {
        toast({ title: 'Erro', description: 'Erro ao atualizar evento.', variant: 'destructive' })
      }
      return
    }

    const isGlobal = finalData.category === 'Camp' || finalData.category === 'Connection'
    if (!currentChurch && !isGlobal) {
      toast({
        title: 'Erro',
        description: 'Selecione uma igreja no menu lateral para agendar.',
        variant: 'destructive',
      })
      return
    }

    try {
      if (isGlobal) {
        await pb.collection('events').create({
          ...finalData,
          church: '',
        })
      } else {
        await addEvent(finalData)
      }
      setOpenNew(false)
      form.reset()
      toast({
        title: 'Sucesso',
        description: 'Evento agendado com sucesso!',
      })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao criar evento.', variant: 'destructive' })
    }
  }

  const validChurchIds = currentChurch ? [currentChurch.id] : []
  if (currentChurch) {
    const guestIds = availableChurches
      .filter((c: any) => c.event_host === currentChurch.id)
      .map((c: any) => c.id)
    validChurchIds.push(...guestIds)
  }

  const now = new Date().toISOString().split('T')[0]
  const churchEvents = events.filter((e) => {
    if (e.category.toLowerCase() === 'reunião' || e.category.toLowerCase() === 'reuniao')
      return false
    if (!e.church || e.category === 'Camp' || e.category === 'Connection') return true
    return user?.role === 'admin' && !currentChurch ? true : validChurchIds.includes(e.church)
  })

  const upcomingEvents = churchEvents
    .filter((e) => e.date >= now && (categoryFilter === 'all' || e.category === categoryFilter))
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastEvents = churchEvents
    .filter((e) => e.date < now && (categoryFilter === 'all' || e.category === categoryFilter))
    .sort((a, b) => b.date.localeCompare(a.date))

  const calendarEvents = events.filter((e) => {
    if (e.category.toLowerCase() === 'reunião' || e.category.toLowerCase() === 'reuniao')
      return false
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
    if (e.category === 'Camp') return true
    if (user?.role !== 'admin' && currentChurch) {
      return validChurchIds.includes(e.church) || !e.church || e.category === 'Connection'
    }
    if (!e.church || e.category === 'Connection') return true
    return (
      e.church === calendarChurch ||
      availableChurches.find((c: any) => c.id === e.church)?.event_host === calendarChurch
    )
  })

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 }),
  })

  const EventCard = ({ event }: { event: any }) => {
    const canEdit =
      user?.role === 'admin' || (event.church && currentChurch && event.church === currentChurch.id)
    return (
      <Card className="hover:shadow-md transition-shadow flex flex-col h-full bg-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="line-clamp-1 text-lg">{event.title}</CardTitle>
                {event.completed && (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" title="Concluído" />
                )}
              </div>
              <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                {event.description}
              </CardDescription>
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingEvent(event)
                      setOpenEdit(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground w-fit">
            {event.category}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />{' '}
              {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              {event.endDate && event.category === 'Camp' && (
                <> a {new Date(event.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" /> {event.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" /> {event.location}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button asChild variant="outline" className="w-full border-border/60 hover:bg-secondary">
            <Link to={`/eventos/${event.id}`}>Ver Detalhes e Presença</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">Acompanhe e crie novas atividades para os Seeds.</p>
        </div>

        <Sheet
          open={openNew || openEdit}
          onOpenChange={(val) => {
            if (!val) {
              setOpenNew(false)
              setOpenEdit(false)
              setEditingEvent(null)
              form.reset()
            } else setOpenNew(true)
          }}
        >
          <SheetTrigger asChild>
            <Button className="shrink-0" onClick={() => setOpenNew(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>{editingEvent ? 'Editar Evento' : 'Agendar Novo Evento'}</SheetTitle>
              <SheetDescription>Preencha os dados do evento.</SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Retiro de Jovens..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Hangout">Hangout</SelectItem>
                          <SelectItem value="Culto">Culto</SelectItem>
                          <SelectItem value="Show de talentos">Show de talentos</SelectItem>
                          {user?.role === 'admin' && (
                            <>
                              <SelectItem value="Connection">Connection</SelectItem>
                              <SelectItem value="Camp">Camp</SelectItem>
                            </>
                          )}
                        </SelectContent>{' '}
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Data{form.watch('category') === 'Camp' ? ' de Início' : ''}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch('category') === 'Camp' && (
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Auditório..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descrição do evento..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-6">
                  {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <div className="flex flex-col gap-4 mb-6">
          <TabsList className="w-fit flex-wrap">
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'Hangout', label: 'Hangout' },
              { id: 'Culto', label: 'Culto' },
              { id: 'Connection', label: 'Connection' },
              { id: 'Camp', label: 'Camp' },
              { id: 'Show de talentos', label: 'Show de talentos' },
            ].map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="calendar" className="animate-fade-in">
          <Card className="p-4 shadow-sm border">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h3 className="font-semibold text-lg capitalize w-40">
                  {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {user?.role === 'admin' && availableChurches.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <Select value={calendarChurch} onValueChange={setCalendarChurch}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecione a Igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChurches
                        .filter((c: any) => !c.event_host)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="text-center text-sm font-semibold p-2 bg-muted">
                  {d}
                </div>
              ))}
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayEvents = calendarEvents.filter((e) => {
                  if (e.endDate && e.category === 'Camp') {
                    return dateStr >= e.date && dateStr <= e.endDate
                  }
                  return e.date === dateStr
                })
                return (
                  <div
                    key={dateStr}
                    className={`min-h-[100px] p-1.5 transition-colors bg-card hover:bg-muted/30 ${!isSameMonth(day, calendarMonth) ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px] no-scrollbar">
                      {dayEvents.map((e) => (
                        <Link
                          key={e.id}
                          to={`/eventos/${e.id}`}
                          className="text-[10px] sm:text-xs leading-tight bg-secondary/60 hover:bg-secondary text-secondary-foreground rounded px-1.5 py-1 truncate block transition-colors border border-transparent hover:border-border"
                          title={e.title}
                        >
                          <span className="font-semibold">{e.time}</span> {e.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="animate-fade-in">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed shadow-sm">
              {categoryFilter === 'all'
                ? 'Nenhum evento agendado.'
                : 'Nenhum evento encontrado para esta categoria.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="animate-fade-in">
          {pastEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed shadow-sm">
              {categoryFilter === 'all'
                ? 'Nenhum evento passado.'
                : 'Nenhum evento encontrado para esta categoria.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
