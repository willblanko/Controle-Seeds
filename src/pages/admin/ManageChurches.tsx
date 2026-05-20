import { useState, useEffect } from 'react'
import { Plus, Users, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ManageChurches() {
  const [churches, setChurches] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [churchUsers, setChurchUsers] = useState<any[]>([])
  const [seeds, setSeeds] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const [selectedChurchUsers, setSelectedChurchUsers] = useState<any | null>(null)

  const [churchModalOpen, setChurchModalOpen] = useState(false)
  const [editingChurch, setEditingChurch] = useState<any | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', event_host: 'none' })

  const [deletingChurch, setDeletingChurch] = useState<any | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const [sortBy, setSortBy] = useState<'name' | 'seeds' | 'teamMembers'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [chs, us, cus, sds, tms] = await Promise.all([
        pb.collection('churches').getFullList(),
        pb.collection('users').getFullList(),
        pb.collection('church_users').getFullList(),
        pb.collection('seeds').getFullList(),
        pb.collection('team_members').getFullList(),
      ])
      setChurches(chs)
      setUsers(us)
      setChurchUsers(cus)
      setSeeds(sds)
      setTeamMembers(tms)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const churchMetrics = churches.map((church) => {
    const cSeeds = seeds.filter((s) => s.church === church.id).length
    const cTeams = teamMembers.filter((t) => t.church === church.id)
    const leaders = cTeams
      .filter((t) => t.role === 'Líder')
      .map((t) => t.name)
      .join(', ')

    return {
      ...church,
      seedCount: cSeeds,
      teamCount: cTeams.length,
      leaders: leaders || 'Sem líderes',
    }
  })

  const sortedChurches = [...churchMetrics].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    if (sortBy === 'seeds') {
      return sortOrder === 'asc' ? a.seedCount - b.seedCount : b.seedCount - a.seedCount
    }
    if (sortBy === 'teamMembers') {
      return sortOrder === 'asc' ? a.teamCount - b.teamCount : b.teamCount - a.teamCount
    }
    return 0
  })

  const toggleSort = (field: 'name' | 'seeds' | 'teamMembers') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder(field === 'name' ? 'asc' : 'desc')
    }
  }

  const SortIcon = ({ field }: { field: 'name' | 'seeds' | 'teamMembers' }) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    )
  }

  const handleOpenCreate = () => {
    setEditingChurch(null)
    setFormData({ name: '', address: '', event_host: 'none' })
    setChurchModalOpen(true)
  }

  const handleOpenEdit = (church: any) => {
    setEditingChurch(church)
    setFormData({
      name: church.name,
      address: church.address || '',
      event_host: church.event_host || 'none',
    })
    setChurchModalOpen(true)
  }

  const handleSaveChurch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const data: any = {
      name: formData.name,
      address: formData.address,
      event_host: formData.event_host === 'none' ? null : formData.event_host,
    }

    try {
      if (editingChurch) {
        await pb.collection('churches').update(editingChurch.id, data)
        toast({ title: 'Sucesso', description: 'Igreja atualizada.' })
      } else {
        await pb.collection('churches').create(data)
        toast({ title: 'Sucesso', description: 'Igreja criada.' })
      }
      setChurchModalOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao salvar igreja.', variant: 'destructive' })
    }
  }

  const handleDeleteClick = (church: any) => {
    setDeletingChurch(church)
    setDeleteConfirmation('')
  }

  const handleConfirmDelete = async () => {
    if (!deletingChurch) return
    if (deleteConfirmation !== deletingChurch.name) return

    try {
      await pb.collection('churches').delete(deletingChurch.id)
      toast({
        title: 'Sucesso',
        description: 'Igreja e registros associados removidos com sucesso.',
      })
      setDeletingChurch(null)
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover igreja.', variant: 'destructive' })
    }
  }

  const handleToggleUser = async (userId: string, isLinked: boolean, cuId?: string) => {
    try {
      if (isLinked && cuId) {
        await pb.collection('church_users').delete(cuId)
      } else {
        await pb.collection('church_users').create({
          user: userId,
          church: selectedChurchUsers.id,
        })
      }
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao atualizar vínculo.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Gerenciar Igrejas</h2>
            <Badge variant="secondary" className="text-xs">
              Total de Igrejas: {churches.length}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Adicione igrejas, gerencie endereços, liderança e acessos.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Nova Igreja
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort('name')} className="cursor-pointer select-none">
                <div className="flex items-center">
                  Nome <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Líderes</TableHead>
              <TableHead
                onClick={() => toggleSort('seeds')}
                className="cursor-pointer select-none w-[120px]"
              >
                <div className="flex items-center">
                  Qtd. Seeds <SortIcon field="seeds" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('teamMembers')}
                className="cursor-pointer select-none w-[140px]"
              >
                <div className="flex items-center">
                  Qtd. Equipe <SortIcon field="teamMembers" />
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedChurches.map((church) => (
              <TableRow key={church.id}>
                <TableCell className="font-medium">
                  {church.name}
                  {church.event_host && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      Host: {churches.find((c) => c.id === church.event_host)?.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm max-w-[200px] truncate"
                  title={church.address}
                >
                  {church.address || '—'}
                </TableCell>
                <TableCell
                  className="text-sm text-muted-foreground max-w-[200px] truncate"
                  title={church.leaders}
                >
                  {church.leaders}
                </TableCell>
                <TableCell>{church.seedCount}</TableCell>
                <TableCell>{church.teamCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Usuários"
                      onClick={() => setSelectedChurchUsers(church)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => handleOpenEdit(church)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      onClick={() => handleDeleteClick(church)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {churches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhuma igreja cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={churchModalOpen} onOpenChange={setChurchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChurch ? 'Editar Igreja' : 'Nova Igreja'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da igreja, incluindo sede principal (se houver).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveChurch} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Ex: Vida Videira Valqueire"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input
                placeholder="Rua, Número, Bairro..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Igreja Host (Para Eventos)</label>
              <Select
                value={formData.event_host}
                onValueChange={(val) => setFormData({ ...formData, event_host: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sede de eventos..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (Sede própria)</SelectItem>
                  {churches
                    .filter((c) => c.id !== editingChurch?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingChurch} onOpenChange={(open) => !open && setDeletingChurch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Igreja</DialogTitle>
            <DialogDescription className="text-destructive font-medium mt-2">
              Esta ação é irreversível. Isso apagará permanentemente todos os seeds, membros da
              equipe, eventos e presenças associados a esta igreja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-foreground">
              Para confirmar, digite o nome da igreja{' '}
              <strong className="select-all">{deletingChurch?.name}</strong> abaixo:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Digite o nome da igreja"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingChurch(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmation !== deletingChurch?.name}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedChurchUsers}
        onOpenChange={(open) => !open && setSelectedChurchUsers(null)}
      >
        {selectedChurchUsers && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Usuários - {selectedChurchUsers.name}</DialogTitle>
              <DialogDescription>
                Selecione os usuários que têm acesso a esta igreja.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {users.map((u) => {
                const link = churchUsers.find(
                  (cu) => cu.user === u.id && cu.church === selectedChurchUsers.id,
                )
                const isLinked = !!link
                return (
                  <div
                    key={u.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`user-${u.id}`}
                      checked={isLinked}
                      onCheckedChange={() => handleToggleUser(u.id, isLinked, link?.id)}
                    />
                    <label
                      htmlFor={`user-${u.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {u.name || u.email}{' '}
                      <span className="text-muted-foreground font-normal">({u.email})</span>
                      {u.role === 'admin' && (
                        <span className="ml-2 text-xs text-blue-500 font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
