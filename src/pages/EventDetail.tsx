import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  CalendarDays,
  Link as LinkIcon,
  CheckCircle,
  Upload,
  X,
  ImageIcon,
  Trash2,
  Users,
  Plus,
} from 'lucide-react'

import { useApp } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

export default function EventDetail() {
  const { id } = useParams()
  const { events, seeds, teamMembers, attendances, toggleAttendance } = useApp()
  const { availableChurches, currentChurch } = useChurch()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isCompleting, setIsCompleting] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [importSearch, setImportSearch] = useState('')

  const event = events.find((e) => e.id === id)

  useEffect(() => {
    if (event?.media) {
      setMediaFiles(Array.isArray(event.media) ? event.media : [event.media])
    }
  }, [event])

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
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Button asChild>
          <Link to="/eventos">Voltar para Eventos</Link>
        </Button>
      </div>
    )
  }

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

  const eventTeamMembers = teamMembers.filter((m) => validChurchIds.includes(m.church))

  const presentSeedsCount = attendances.filter(
    (a) => a.event === id && a.type === 'seed' && a.present,
  ).length
  const presentTeamCount = attendances.filter(
    (a) => a.event === id && a.type === 'team' && a.present,
  ).length

  const canComplete = () => {
    if (event.completed) return false
    if (user?.role === 'admin') return true
    if (event.category === 'Camp' || event.category === 'Connection') return false
    if (event.church && currentChurch && event.church === currentChurch.id) return true
    return false
  }

  const handleCompleteEvent = async () => {
    const hasSeedAttendance = attendances.some(
      (a) => a.event === id && a.type === 'seed' && a.present,
    )
    const hasTeamAttendance = attendances.some(
      (a) => a.event === id && a.type === 'team' && a.present,
    )

    if (
      (eventSeeds.length > 0 && !hasSeedAttendance) ||
      (eventTeamMembers.length > 0 && !hasTeamAttendance)
    ) {
      toast({
        title: 'Atenção',
        description:
          'Registre pelo menos uma presença de Seed e de Equipe antes de concluir o evento.',
        variant: 'destructive',
      })
      return
    }

    setIsCompleting(true)
    try {
      await pb.collection('events').update(event.id, { completed: true })
      toast({ title: 'Sucesso', description: 'Evento marcado como concluído!' })
      setTimeout(() => window.location.reload(), 500)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir o evento.',
        variant: 'destructive',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDeleteEvent = async () => {
    try {
      await pb.collection('events').delete(event.id)
      toast({ title: 'Sucesso', description: 'Evento excluído com sucesso!' })
      navigate('/eventos')
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive',
      })
    }
  }

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    if (files.some((f) => f.size > 52428800)) {
      toast({
        title: 'Erro',
        description: 'Um ou mais arquivos excedem o limite de 50MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('media', f))
      const updatedRecord = await pb.collection('events').update(event.id, formData)
      setMediaFiles(
        Array.isArray(updatedRecord.media) ? updatedRecord.media : [updatedRecord.media],
      )
      toast({ title: 'Sucesso', description: 'Mídia adicionada com sucesso!' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da mídia.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveMedia = async (filename: string) => {
    try {
      const updatedRecord = await pb.collection('events').update(event.id, {
        'media-': filename,
      })
      setMediaFiles(
        Array.isArray(updatedRecord.media)
          ? updatedRecord.media
          : updatedRecord.media
            ? [updatedRecord.media]
            : [],
      )
      toast({ title: 'Sucesso', description: 'Mídia removida com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover mídia.', variant: 'destructive' })
    }
  }

  const handleSaveNotes = () => {
    toast({
      title: 'Anotações salvas',
      description: 'Suas observações foram registradas com sucesso.',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{event.title}</h2>
              {event.completed && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  Concluído
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />{' '}
                {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                {event.endDate && event.category === 'Camp' && (
                  <>
                    <span className="text-muted-foreground mx-1">até</span>
                    {new Date(event.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> {event.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {event.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" asChild>
              <Link to={`/eventos/${event.id}/check-in`} target="_blank">
                <LinkIcon className="mr-2 h-4 w-4" /> Gerar Link de Presença
              </Link>
            </Button>
            {canComplete() && (
              <Button onClick={handleCompleteEvent} disabled={isCompleting}>
                <CheckCircle className="mr-2 h-4 w-4" />{' '}
                {isCompleting ? 'Concluindo...' : 'Concluir Evento'}
              </Button>
            )}
            {user?.role === 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shrink-0">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir Evento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. O evento e todas as presenças registradas serão
                      apagados permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteEvent}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle>Presença</CardTitle>
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
                      {presentSeedsCount}/{eventSeeds.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="team" className="gap-2">
                    Equipe{' '}
                    <Badge variant="secondary" className="ml-1 rounded-full">
                      {presentTeamCount}/{eventTeamMembers.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="seeds" className="space-y-4 mt-4">
                  {isCamp && !event.completed && (
                    <div className="flex justify-end mb-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
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
                                  Nenhum seed disponível.
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
                    </div>
                  )}

                  <div className="space-y-3">
                    {eventSeeds.map((seed, i) => {
                      const attendance = attendances.find(
                        (a) => a.event === event.id && a.seed === seed.id && a.type === 'seed',
                      )
                      const isPresent = attendance?.present || false
                      return (
                        <div
                          key={seed.id}
                          className={`flex flex-col p-3 rounded-lg border transition-colors animate-fade-in ${
                            isPresent ? 'border-primary/50 bg-primary/5' : 'bg-card'
                          }`}
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{seed.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Contato: {seed.guardian1}
                              </p>
                            </div>
                            <Switch
                              checked={isPresent}
                              disabled={event.completed}
                              onCheckedChange={() => toggleAttendance(event.id, seed.id, 'seed')}
                            />
                          </div>

                          {isTalentShow && isPresent && attendance && (
                            <div className="mt-3 pt-3 border-t border-primary/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                  Participante do Show?
                                </span>
                                <Switch
                                  checked={attendance.is_participant || false}
                                  disabled={event.completed}
                                  onCheckedChange={(val) =>
                                    handleUpdateTalent(attendance.id, 'is_participant', val)
                                  }
                                />
                              </div>
                              {attendance.is_participant && (
                                <div className="space-y-1">
                                  <Input
                                    placeholder="Qual o talento?"
                                    defaultValue={attendance.talent_details || ''}
                                    disabled={event.completed}
                                    onBlur={(e) =>
                                      handleUpdateTalent(
                                        attendance.id,
                                        'talent_details',
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs bg-background"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {eventSeeds.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                        {isCamp
                          ? 'Nenhum participante importado. Use o botão acima.'
                          : 'Nenhum Seed encontrado para marcar presença.'}
                      </div>
                    )}
                  </div>
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
                          disabled={event.completed}
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
              <Button className="w-full" onClick={handleSaveNotes} disabled={event.completed}>
                Salvar Anotações
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Fotos e Vídeos</CardTitle>
              <CardDescription>Galeria de mídias do evento.</CardDescription>
            </CardHeader>
            <CardContent>
              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {mediaFiles.map((filename: string) => {
                    const url = pb.files.getUrl(event, filename)
                    const isVideo = filename.match(/\.(mp4|mov|webm)$/i)
                    return (
                      <div
                        key={filename}
                        className="relative group rounded-md overflow-hidden bg-muted aspect-square"
                      >
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={url}
                            alt="Mídia do evento"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!event.completed && (
                          <button
                            onClick={() => handleRemoveMedia(filename)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg bg-muted/30 mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma mídia adicionada.</p>
                </div>
              )}

              {!event.completed && (
                <div>
                  <Input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleUploadMedia}
                    disabled={isUploading || mediaFiles.length >= 10}
                  />
                  <label htmlFor="media-upload">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={isUploading || mediaFiles.length >= 10}
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Enviando...' : 'Adicionar Mídia'}
                      </span>
                    </Button>
                  </label>
                  {mediaFiles.length >= 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Limite de 10 arquivos atingido.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
