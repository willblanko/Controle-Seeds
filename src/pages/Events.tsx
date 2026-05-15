import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Clock, CalendarDays } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useApp } from '@/contexts/app-context'
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

const eventSchema = z.object({
  title: z.string().min(3, 'Título obrigatório'),
  description: z.string().min(5, 'Descrição obrigatória'),
  date: z.string().min(10, 'Data obrigatória'),
  time: z.string().min(4, 'Horário obrigatório'),
  location: z.string().min(3, 'Local obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
})

export default function Events() {
  const { events, addEvent } = useApp()
  const { toast } = useToast()
  const [openNew, setOpenNew] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: '',
    },
  })

  function onSubmit(data: z.infer<typeof eventSchema>) {
    addEvent(data)
    setOpenNew(false)
    form.reset()
    toast({
      title: 'Sucesso',
      description: 'Evento agendado com sucesso!',
    })

    // Sincronização automatizada simulada com Google Calendar
    setTimeout(() => {
      toast({
        title: 'Integração Google Calendar',
        description: 'Evento sincronizado com sucesso e convites enviados para a Equipe.',
      })
    }, 1500)
  }

  const now = new Date().toISOString().split('T')[0]
  const upcomingEvents = events
    .filter((e) => e.date >= now && (categoryFilter === 'all' || e.category === categoryFilter))
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastEvents = events
    .filter((e) => e.date < now && (categoryFilter === 'all' || e.category === categoryFilter))
    .sort((a, b) => b.date.localeCompare(a.date))

  const EventCard = ({ event }: { event: any }) => (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-lg">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
              {event.description}
            </CardDescription>
          </div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">Acompanhe e crie novas atividades para os Seeds.</p>
        </div>

        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Agendar Novo Evento</SheetTitle>
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
                        <Input placeholder="Workshop..." {...field} />
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
                          <SelectItem value="Connection">Connection</SelectItem>
                          <SelectItem value="Camp">Camp</SelectItem>
                          <SelectItem value="Reunião">Reunião</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  Criar Evento
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex flex-col gap-4 mb-6">
          <TabsList className="w-fit">
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
              { id: 'Reunião', label: 'Reunião' },
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
