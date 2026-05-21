import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Star, User as UserIcon, Pencil, Upload, Loader2, Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { TeamMemberForm } from '@/components/team-member-form'
import { cn } from '@/lib/utils'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ChurchSelector } from '@/components/church-selector'

function calculateAge(dob: string) {
  if (!dob) return 0
  const diffMs = Date.now() - new Date(dob).getTime()
  const ageDt = new Date(diffMs)
  return Math.abs(ageDt.getUTCFullYear() - 1970)
}

function memberRoleColors(role: string) {
  return role === 'Líder'
    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
    : 'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
}

type FilterRole = 'Todos' | 'Líderes' | 'Membros' | 'CME' | 'EBM' | 'TE'

export default function Equipe() {
  const { currentChurch, availableChurches } = useChurch()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('Todos')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberToDelete, setMemberToDelete] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [fetchedTeam, fetchedEvents, fetchedAtt] = await Promise.all([
        pb.collection('team_members').getFullList(),
        pb.collection('events').getFullList(),
        pb.collection('attendances').getFullList(),
      ])
      setTeamMembers(fetchedTeam)
      setEvents(fetchedEvents)
      setAttendances(fetchedAtt)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredMembers = useMemo(() => {
    const validChurchIds = currentChurch ? [currentChurch.id] : []
    if (currentChurch) {
      const guestIds = availableChurches
        .filter((c: any) => c.event_host === currentChurch.id)
        .map((c: any) => c.id)
      validChurchIds.push(...guestIds)
    }

    return teamMembers.filter((member) => {
      const matchChurch = validChurchIds.includes(member.church)
      if (!matchChurch) return false
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase())
      let matchesRole = true

      switch (filterRole) {
        case 'Líderes':
          matchesRole = member.role === 'Líder'
          break
        case 'Membros':
          matchesRole = member.role === 'Membro'
          break
        case 'CME':
          matchesRole = ['Completo', 'Em progresso'].includes(member.courses?.cme?.status)
          break
        case 'EBM':
          matchesRole =
            ['Completo', 'Em progresso'].includes(member.courses?.ebm?.status) ||
            member.courses?.EBM === 'Sim'
          break
        case 'TE':
          matchesRole =
            ['Completo', 'Em progresso'].includes(member.courses?.te?.status) ||
            member.courses?.TE === 'Sim'
          break
        case 'Todos':
        default:
          matchesRole = true
          break
      }

      return matchesSearch && matchesRole
    })
  }, [teamMembers, search, filterRole, currentChurch, availableChurches])

  const getStats = (memberId: string, churchId: string) => {
    const memberAtts = attendances.filter((a) => a.team_member === memberId && a.present)
    const churchPastEvents = events.filter(
      (e) => (e.church === churchId || e.category === 'Camp') && new Date(e.date) < new Date(),
    )
    const presences = memberAtts.length
    const absences = Math.max(0, churchPastEvents.length - presences)
    return { presences, absences }
  }

  const handleAddMember = async (data: any) => {
    if (!currentChurch) {
      toast({
        title: 'Erro',
        description: 'Selecione uma igreja no menu superior para cadastrar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('dateOfBirth', data.dateOfBirth)
      formData.append('role', data.role)
      formData.append('sex', data.sex)
      formData.append('church', currentChurch.id)
      formData.append('courses', JSON.stringify(data.courses))
      if (data.photoUrl instanceof File) {
        formData.append('photo', data.photoUrl)
      }

      await pb.collection('team_members').create(formData)
      await loadData()
      setIsCreateOpen(false)
      toast({ title: 'Membro adicionado com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleUpdateMember = async (data: any) => {
    if (!selectedMember) return
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('dateOfBirth', data.dateOfBirth)
      formData.append('role', data.role)
      formData.append('sex', data.sex)
      formData.append('courses', JSON.stringify(data.courses))
      if (data.photoUrl instanceof File) {
        formData.append('photo', data.photoUrl)
      }

      const updated = await pb.collection('team_members').update(selectedMember.id, formData)
      await loadData()
      setIsEditMode(false)
      setSelectedMember(updated)
      toast({ title: 'Membro atualizado com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return
    try {
      await pb.collection('team_members').delete(memberToDelete.id)
      await loadData()
      setMemberToDelete(null)
      toast({ title: 'Membro removido com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    setImportErrors([])
    const errors: string[] = []

    try {
      const text = await importFile.text()
      const lines = text.split('\n').filter((l) => l.trim().length > 0)
      if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados válidos.')

      const headers = lines[0].split(';').map((h) => h.replace(/^"|"$/g, '').trim())
      const churches = await pb.collection('churches').getFullList()

      let successCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map((v) => v.replace(/^"|"$/g, '').trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx] || ''
        })

        const churchName = row['Igreja']
        const churchMatch = churches.find((c) => c.name.toLowerCase() === churchName?.toLowerCase())

        if (!churchMatch) {
          errors.push(`Linha ${i + 1}: Igreja '${churchName}' não encontrada.`)
          continue
        }

        if (!row['Nome']) {
          errors.push(`Linha ${i + 1}: O campo 'Nome' é obrigatório.`)
          continue
        }

        const rawDob = row['Nascimento'] || ''
        let dob = ''
        if (rawDob) {
          const parts = rawDob.split('/')
          if (parts.length === 3) {
            dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }

        if (!dob) {
          errors.push(`Linha ${i + 1}: O campo 'Nascimento' é obrigatório.`)
          continue
        }

        const ebmVal = row['EBM'] || ''
        const teVal = row['TE'] || ''
        const cmeVal = row['CME'] || ''

        const ebmMapped =
          ebmVal === 'Sim' ? 'Completo' : ebmVal === 'Cursando' ? 'Em progresso' : 'Não feito'
        const teMapped =
          teVal === 'Sim' ? 'Completo' : teVal === 'Cursando' ? 'Em progresso' : 'Não feito'
        const cmeMapped =
          cmeVal === 'Sim' ? 'Completo' : cmeVal === 'Cursando' ? 'Em progresso' : 'Não feito'

        const memberData = {
          church: churchMatch.id,
          name: row['Nome'],
          dateOfBirth: dob,
          role: row['Função'] || 'Membro',
          sex: row['Sexo'] || 'Masculino',
          courses: {
            TE: teVal,
            EBM: ebmVal,
            cme: { status: cmeMapped },
            ebm: { status: ebmMapped },
            te: { status: teMapped },
          },
        }

        try {
          await pb.collection('team_members').create(memberData)
          successCount++
        } catch (e: any) {
          errors.push(`Linha ${i + 1}: ${e.message}`)
        }
      }

      await loadData()
      if (errors.length > 0) {
        setImportErrors(errors)
      } else {
        toast({ title: 'Importação concluída', description: `${successCount} membros importados.` })
        setIsImportOpen(false)
        setImportFile(null)
      }
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Houve um erro ao processar o arquivo CSV.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const pbFileUrl = (record: any, fileName: string) => {
    return fileName
      ? `${pb.baseUrl}/api/files/${record.collectionId}/${record.id}/${fileName}`
      : undefined
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie líderes e membros da sua equipe.</p>
        </div>
        <div className="flex items-center gap-2">
          <ChurchSelector allowGlobal={false} />

          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => {
              const csvContent =
                'Nome;Nascimento;Igreja;Função;Sexo;EBM;TE;CME\nExemplo Membro;01/01/2000;Sede;Membro;Masculino;Sim;Não;Cursando\n'
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.setAttribute('href', url)
              link.setAttribute('download', 'modelo_equipe.csv')
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            Baixar Modelo (csv)
          </Button>

          <Dialog
            open={isImportOpen}
            onOpenChange={(open) => {
              setIsImportOpen(open)
              setImportErrors([])
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Upload className="h-4 w-4" />
                <span>Importar Equipe</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Importar Equipe</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo CSV para importar a equipe. O delimitador deve ser
                  ponto-e-vírgula (;).
                </DialogDescription>
              </DialogHeader>

              {importErrors.length > 0 ? (
                <div className="bg-red-50 text-red-800 p-4 rounded-md max-h-[300px] overflow-auto text-sm border border-red-200">
                  <h4 className="font-semibold mb-2">Erros encontrados:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {importErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(false)}
                  disabled={isImporting}
                >
                  Fechar
                </Button>
                {importErrors.length === 0 && (
                  <Button onClick={handleImport} disabled={!importFile || isImporting}>
                    {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isImporting ? 'Importando...' : 'Importar'}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span>Novo Membro</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Membro</DialogTitle>
                <DialogDescription>Cadastre um novo membro para a equipe.</DialogDescription>
              </DialogHeader>
              <TeamMemberForm onSubmit={handleAddMember} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome..."
            className="pl-9 bg-card shadow-sm h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(['Todos', 'Líderes', 'Membros', 'CME', 'EBM', 'TE'] as FilterRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors border',
                filterRole === role
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Membro</TableHead>
              <TableHead className="hidden sm:table-cell">Idade</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="hidden md:table-cell">Frequência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member, i) => {
                const stats = getStats(member.id, member.church)
                return (
                  <TableRow
                    key={member.id}
                    className="animate-fade-in hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border hidden sm:block">
                          <AvatarImage src={pbFileUrl(member, member.photo)} alt={member.name} />
                          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-base truncate">{member.name}</span>
                          <span className="text-xs text-muted-foreground sm:hidden truncate">
                            {calculateAge(member.dateOfBirth)} anos
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {calculateAge(member.dateOfBirth)} anos
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'px-2.5 py-0.5 font-medium whitespace-nowrap',
                          memberRoleColors(member.role),
                        )}
                      >
                        {member.role === 'Líder' ? (
                          <Star className="w-3 h-3 mr-1.5 fill-current" />
                        ) : (
                          <UserIcon className="w-3 h-3 mr-1.5" />
                        )}
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col text-xs font-medium">
                        <span className="text-green-600">{stats.presences} presenças</span>
                        <span className="text-red-500">{stats.absences} faltas</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMember(member)}>
                        Ver Perfil
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setMemberToDelete(member)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null)
            setIsEditMode(false)
          }
        }}
      >
        {selectedMember && (
          <DialogContent className="sm:max-w-xl">
            {isEditMode ? (
              <>
                <DialogHeader>
                  <DialogTitle>Editar Membro</DialogTitle>
                  <DialogDescription>Atualize as informações do membro.</DialogDescription>
                </DialogHeader>
                <TeamMemberForm
                  initialData={selectedMember}
                  onSubmit={handleUpdateMember}
                  onCancel={() => setIsEditMode(false)}
                />
              </>
            ) : (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Perfil do Membro</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogDescription>
                    Detalhes e treinamentos do membro da equipe.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border">
                      <AvatarImage
                        src={pbFileUrl(selectedMember, selectedMember.photo)}
                        alt={selectedMember.name}
                      />
                      <AvatarFallback>
                        {selectedMember.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-xl">{selectedMember.name}</span>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={cn(memberRoleColors(selectedMember.role))}
                        >
                          {selectedMember.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Sexo</span>
                      <span className="font-medium">{selectedMember.sex || 'Não informado'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Idade</span>
                      <span className="font-medium">
                        {calculateAge(selectedMember.dateOfBirth)} anos
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-3">Treinamentos</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">CME</span>
                        <span className="font-medium">
                          {selectedMember.courses?.cme?.status || 'Não feito'}
                          {selectedMember.courses?.cme?.status === 'Completo' &&
                            selectedMember.courses?.cme?.completionYear &&
                            ` (${selectedMember.courses.cme.completionYear})`}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">EBM</span>
                        <span className="font-medium">
                          {selectedMember.courses?.ebm?.status ||
                            selectedMember.courses?.EBM ||
                            'Não feito'}
                          {selectedMember.courses?.ebm?.status === 'Completo' &&
                            selectedMember.courses?.ebm?.completionYear &&
                            ` (${selectedMember.courses.ebm.completionYear})`}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">TE</span>
                        <span className="font-medium">
                          {selectedMember.courses?.te?.status ||
                            selectedMember.courses?.TE ||
                            'Não feito'}
                          {selectedMember.courses?.te?.status === 'Completo' &&
                            selectedMember.courses?.te?.completionYear &&
                            ` (${selectedMember.courses.te.completionYear})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza? <strong>Esta ação é irreversível</strong> e todos os dados de{' '}
              {memberToDelete?.name} serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
