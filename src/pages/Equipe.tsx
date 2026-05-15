import { useState, useMemo } from 'react'
import { Search, Plus, Star, User as UserIcon } from 'lucide-react'

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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { TeamMember } from '@/types/team'
import { TeamMemberForm } from '@/components/team-member-form'
import { cn } from '@/lib/utils'

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Alvanice',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    email: 'alvanice@example.com',
    dateOfBirth: '1985-05-12',
    role: 'Líder',
    courses: {
      cme: { status: 'Completo', completionYear: '2020' },
      ebm: { status: 'Em progresso' },
      te: { status: 'Não feito' },
    },
  },
  {
    id: '2',
    name: 'Amaury Silva',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    email: 'amaury@example.com',
    dateOfBirth: '1990-10-21',
    role: 'Membro',
    courses: {
      cme: { status: 'Completo', completionYear: '2018' },
      ebm: { status: 'Completo', completionYear: '2021' },
      te: { status: 'Em progresso' },
    },
  },
  {
    id: '3',
    name: 'Ana Carolina Dias',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
    email: 'anacarol@example.com',
    dateOfBirth: '1995-03-15',
    role: 'Líder',
    courses: {
      cme: { status: 'Não feito' },
      ebm: { status: 'Não feito' },
      te: { status: 'Não feito' },
    },
  },
]

function calculateAge(dob: string) {
  if (!dob) return 0
  const diffMs = Date.now() - new Date(dob).getTime()
  const ageDt = new Date(diffMs)
  return Math.abs(ageDt.getUTCFullYear() - 1970)
}

type FilterRole = 'Todos' | 'Líderes' | 'Membros'

export default function Equipe() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('Todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase())
      const matchesRole =
        filterRole === 'Todos'
          ? true
          : filterRole === 'Líderes'
            ? member.role === 'Líder'
            : member.role === 'Membro'

      return matchesSearch && matchesRole
    })
  }, [members, search, filterRole])

  const handleAddMember = (data: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    }
    setMembers((prev) => [...prev, newMember])
    setIsDialogOpen(false)
    toast({
      title: 'Membro adicionado',
      description: `${newMember.name} foi adicionado à equipe com sucesso.`,
    })
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie líderes e membros da sua equipe.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Membro</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
            </DialogHeader>
            <TeamMemberForm onSubmit={handleAddMember} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome..."
            className="pl-9 bg-background shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Líderes', 'Membros'] as FilterRole[]).map((role) => (
            <Button
              key={role}
              variant={filterRole === role ? 'default' : 'secondary'}
              size="sm"
              className={cn(
                'rounded-full px-4 transition-colors',
                filterRole === role && 'bg-blue-600 hover:bg-blue-700 text-white',
              )}
              onClick={() => setFilterRole(role)}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-background rounded-xl border shadow-sm flex-1 overflow-hidden">
        {filteredMembers.length > 0 ? (
          <div className="divide-y">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={member.photoUrl} alt={member.name} />
                  <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{member.name}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {member.email} &bull; {calculateAge(member.dateOfBirth)} anos
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-2.5 py-0.5 font-medium',
                      member.role === 'Líder'
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        : 'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                    )}
                  >
                    {member.role === 'Líder' ? (
                      <Star className="w-3 h-3 mr-1.5 fill-current" />
                    ) : (
                      <UserIcon className="w-3 h-3 mr-1.5" />
                    )}
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <UserIcon className="w-12 h-12 mb-3 text-muted-foreground/50" />
            <p>Nenhum membro encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
