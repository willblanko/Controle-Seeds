import { useState, useEffect } from 'react'
import { Plus, UserCog, Pencil, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [churchUsers, setChurchUsers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' })
  const [selectedChurches, setSelectedChurches] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [us, chs, cus] = await Promise.all([
        pb.collection('users').getFullList(),
        pb.collection('churches').getFullList(),
        pb.collection('church_users').getFullList(),
      ])
      setUsers(us)
      setChurches(chs)
      setChurchUsers(cus)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'user' })
    setSelectedChurches([])
    setErrors({})
    setOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email, password: '', role: user.role || 'user' })
    setSelectedChurches(churchUsers.filter((cu) => cu.user === user.id).map((cu) => cu.church))
    setErrors({})
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (formData.role === 'user' && selectedChurches.length === 0) {
      setErrors({ churches: 'Selecione pelo menos uma igreja.' })
      return
    }

    try {
      let savedUser

      if (editingUser) {
        const data: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }
        if (formData.password) {
          data.password = formData.password
          data.passwordConfirm = formData.password
        }
        savedUser = await pb.collection('users').update(editingUser.id, data)

        const currentLinks = churchUsers.filter((cu) => cu.user === editingUser.id)

        if (formData.role === 'admin') {
          for (const cu of currentLinks) {
            await pb.collection('church_users').delete(cu.id)
          }
        } else {
          const currentChurchIds = currentLinks.map((cu) => cu.church)
          const toAdd = selectedChurches.filter((id) => !currentChurchIds.includes(id))
          const toRemove = currentLinks.filter((cu) => !selectedChurches.includes(cu.church))

          for (const id of toAdd) {
            await pb.collection('church_users').create({ user: editingUser.id, church: id })
          }
          for (const cu of toRemove) {
            await pb.collection('church_users').delete(cu.id)
          }
        }

        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
      } else {
        savedUser = await pb.collection('users').create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.password,
          role: formData.role,
        })

        if (formData.role === 'user') {
          for (const churchId of selectedChurches) {
            await pb.collection('church_users').create({ user: savedUser.id, church: churchId })
          }
        }

        toast({ title: 'Sucesso', description: 'Usuário criado com sucesso.' })
      }

      setOpen(false)
      loadData()
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: 'Falha ao salvar usuário.', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (
      !confirm('Tem certeza que deseja remover este usuário? Todas as associações serão perdidas.')
    )
      return
    try {
      await pb.collection('users').delete(id)
      toast({ title: 'Sucesso', description: 'Usuário removido.' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover usuário.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            Adicione e gerencie os usuários e seus acessos ao sistema.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nível de Acesso</TableHead>
              <TableHead>Igrejas Associadas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const uChurches = churchUsers
                .filter((cu) => cu.user === u.id)
                .map((cu) => churches.find((c) => c.id === cu.church))
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <span className="font-medium">{u.name || 'Sem nome'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === 'admin' ? 'default' : 'secondary'}
                      className="uppercase text-[10px]"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {uChurches.map((c, i) =>
                        c ? (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">
                            {c.name}
                          </Badge>
                        ) : null,
                      )}
                      {uChurches.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhuma</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)}>
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}>
                        <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize as informações e acessos do usuário.'
                : 'Preencha os dados para convidar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Ex: João da Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                readOnly={!!editingUser}
                disabled={!!editingUser}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Senha{' '}
                {editingUser && (
                  <span className="text-muted-foreground font-normal">(Opcional)</span>
                )}
              </label>
              <Input
                type="password"
                placeholder={
                  editingUser ? 'Deixe em branco para não alterar' : 'Mínimo 8 caracteres'
                }
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de Acesso</label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário Padrão</SelectItem>
                  <SelectItem value="admin">Administrador Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'user' && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <label className="text-sm font-medium">
                  Igrejas Associadas <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-md max-h-[160px] overflow-y-auto bg-muted/10">
                  {churches.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`church-${c.id}`}
                        checked={selectedChurches.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedChurches([...selectedChurches, c.id])
                          else setSelectedChurches(selectedChurches.filter((id) => id !== c.id))
                        }}
                      />
                      <label
                        htmlFor={`church-${c.id}`}
                        className="text-sm cursor-pointer hover:text-primary transition-colors"
                      >
                        {c.name}
                      </label>
                    </div>
                  ))}
                  {churches.length === 0 && (
                    <div className="text-xs text-muted-foreground col-span-2">
                      Nenhuma igreja cadastrada no sistema.
                    </div>
                  )}
                </div>
                {errors.churches && <p className="text-xs text-destructive">{errors.churches}</p>}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Salvar Usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
