import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, UserPlus, MapPin, Clock, Info, Trash2, ArrowLeft } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState<any>(null)
  const [attendances, setAttendances] = useState<any[]>([])
  const [visitorName, setVisitorName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const ev = await pb.collection('events').getOne(id)
      setEvent(ev)
      const atts = await pb
        .collection('attendances')
        .getFullList({ filter: `event='${id}'`, expand: 'seed,team_member' })
      setAttendances(atts)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleDeleteEvent = async () => {
    if (!id) return
    try {
      await pb.collection('events').delete(id)
      toast({ title: 'Evento excluído.' })
      navigate('/eventos')
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleAddVisitor = async () => {
    if (!visitorName.trim()) return
    try {
      await pb.collection('attendances').create({
        event: id,
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

  if (!event) return <div className="p-8">Carregando...</div>

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-up space-y-6">
      <div
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer w-fit"
        onClick={() => navigate('/eventos')}
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para eventos
      </div>

      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <Badge>{event.category}</Badge>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleting(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Evento
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {event.time}
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
          )}
        </div>
        {event.description && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground mt-2 bg-muted/30 p-3 rounded-md border">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{event.description}</p>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível e excluirá o evento e todas as presenças vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold">Adicionar Visitantes</h3>
        <p className="text-sm text-muted-foreground">
          Registre visitantes manualmente na lista de presenças sem precisar cadastrá-los como
          Seeds.
        </p>
        <div className="flex items-center gap-3">
          <Input
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Nome do visitante..."
            className="max-w-md"
          />
          <Button onClick={handleAddVisitor} className="gap-2">
            <UserPlus className="w-4 h-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold">Lista de Presenças Registradas</h3>
        {attendances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém registrado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {attendances.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 text-sm border-b pb-2 last:border-0"
              >
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-medium">
                  {a.expand?.seed?.name || a.expand?.team_member?.name || a.visitor_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {a.type === 'visitor' ? 'Visitante' : a.type === 'seed' ? 'Seed' : 'Equipe'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
