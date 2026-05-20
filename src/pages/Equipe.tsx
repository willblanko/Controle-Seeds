import { useState, useMemo } from 'react'
import { Search, Plus, Star, User as UserIcon, Pencil } from 'lucide-react'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { TeamMember } from '@/types/team'
import { TeamMemberForm } from '@/components/team-member-form'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/app-context'

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
  const { teamMembers, addTeamMember, updateTeamMember } = useApp()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('Todos')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
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
          matchesRole = member.courses.cme.status === 'Completo'
          break
        case 'EBM':
          matchesRole = member.courses.ebm.status === 'Completo'
          break
        case 'TE':
          matchesRole = member.courses.te.status === 'Completo'
          break
        case 'Todos':
        default:
          matchesRole = true
          break
      }

      return matchesSearch && matchesRole
    })
  }, [teamMembers, search, filterRole])

  const handleAddMember = async (data: Omit<TeamMember, 'id' | 'church'>) => {
    await addTeamMember(data)
    setIsCreateOpen(false)
    toast({
      title: 'Membro adicionado',
      description: `${data.name} foi adicionado à equipe com sucesso.`,
    })
  }

  const handleUpdateMember = async (data: Omit<TeamMember, 'id' | 'church'>) => {
    if (selectedMember) {
      await updateTeamMember(selectedMember.id, data)
      setIsEditMode(false)
      setSelectedMember({ ...data, id: selectedMember.id })
      toast({
        title: 'Membro atualizado',
        description: `${data.name} foi atualizado com sucesso.`,
      })
    }
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie líderes e membros da sua equipe.</p>
        </div>
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
              <TableHead className="hidden sm:table-cell">Contato</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member, i) => (
                <TableRow
                  key={member.id}
                  className="animate-fade-in hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border hidden sm:block">
                        <AvatarImage src={member.photoUrl} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-base truncate">{member.name}</span>
                        <span className="text-xs text-muted-foreground sm:hidden truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm truncate">{member.email || '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {calculateAge(member.dateOfBirth)} anos
                      </span>
                    </div>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMember(member)}>
                      Ver Perfil
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
                      <AvatarImage src={selectedMember.photoUrl} alt={selectedMember.name} />
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
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedMember.email || 'Não informado'}</span>
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
                          {selectedMember.courses.cme.status}
                          {selectedMember.courses.cme.status === 'Completo' &&
                            selectedMember.courses.cme.completionYear &&
                            ` (${selectedMember.courses.cme.completionYear})`}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">EBM</span>
                        <span className="font-medium">
                          {selectedMember.courses.ebm.status}
                          {selectedMember.courses.ebm.status === 'Completo' &&
                            selectedMember.courses.ebm.completionYear &&
                            ` (${selectedMember.courses.ebm.completionYear})`}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">TE</span>
                        <span className="font-medium">
                          {selectedMember.courses.te.status}
                          {selectedMember.courses.te.status === 'Completo' &&
                            selectedMember.courses.te.completionYear &&
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
    </div>
  )
}
