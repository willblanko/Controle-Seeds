import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export default function ManageChurches() {
  const [churches, setChurches] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [churchUsers, setChurchUsers] = useState<any[]>([])
  const [newChurchName, setNewChurchName] = useState('')
  const [selectedChurch, setSelectedChurch] = useState<any | null>(null)

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [chs, us, cus] = await Promise.all([
        pb.collection('churches').getFullList(),
        pb.collection('users').getFullList(),
        pb.collection('church_users').getFullList(),
      ])
      setChurches(chs)
      setUsers(us)
      setChurchUsers(cus)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateChurch = async () => {
    if (!newChurchName.trim()) return
    try {
      await pb.collection('churches').create({ name: newChurchName })
      setNewChurchName('')
      toast({ title: 'Sucesso', description: 'Igreja criada.' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao criar igreja.', variant: 'destructive' })
    }
  }

  const handleToggleUser = async (userId: string, isLinked: boolean, cuId?: string) => {
    try {
      if (isLinked && cuId) {
        await pb.collection('church_users').delete(cuId)
      } else {
        await pb.collection('church_users').create({
          user: userId,
          church: selectedChurch.id,
        })
      }
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar vínculo.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Igrejas</h2>
        <p className="text-muted-foreground">Adicione igrejas e gerencie acessos de usuários.</p>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Nome da nova igreja..."
          value={newChurchName}
          onChange={(e) => setNewChurchName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleCreateChurch}>
          <Plus className="mr-2 h-4 w-4" /> Criar
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {churches.map((church) => (
              <TableRow key={church.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {church.id}
                </TableCell>
                <TableCell className="font-medium">{church.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedChurch(church)}>
                    <Users className="mr-2 h-4 w-4" /> Usuários
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {churches.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Nenhuma igreja cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedChurch} onOpenChange={(open) => !open && setSelectedChurch(null)}>
        {selectedChurch && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Usuários - {selectedChurch.name}</DialogTitle>
              <DialogDescription>
                Selecione os usuários que têm acesso a esta igreja.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {users.map((u) => {
                const link = churchUsers.find(
                  (cu) => cu.user === u.id && cu.church === selectedChurch.id,
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
