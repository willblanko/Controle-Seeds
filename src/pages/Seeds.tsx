import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, User as UserIcon, Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { useChurch } from '@/contexts/church-context'
import pb from '@/lib/pocketbase/client'
import { ChurchSelector } from '@/components/church-selector'

export default function Seeds() {
  const { currentChurch, availableChurches } = useChurch()
  const [search, setSearch] = useState('')
  const [seeds, setSeeds] = useState<any[]>([])
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await pb.collection('seeds').getFullList()
      setSeeds(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSeeds = useMemo(() => {
    const validChurchIds = currentChurch ? [currentChurch.id] : []
    if (currentChurch) {
      const guestIds = availableChurches
        .filter((c: any) => c.event_host === currentChurch.id)
        .map((c: any) => c.id)
      validChurchIds.push(...guestIds)
    }

    return seeds.filter((seed) => {
      const matchChurch = validChurchIds.includes(seed.church)
      if (!matchChurch) return false
      return seed.name.toLowerCase().includes(search.toLowerCase())
    })
  }, [seeds, search, currentChurch, availableChurches])

  const pbFileUrl = (record: any, fileName: string) => {
    return fileName
      ? `${pb.baseUrl}/api/files/${record.collectionId}/${record.id}/${fileName}`
      : undefined
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seeds</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de seeds da sua igreja.</p>
        </div>
        <div className="flex items-center gap-2">
          <ChurchSelector allowGlobal={false} />

          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Novo Seed</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 bg-card shadow-sm h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Seed</TableHead>
              <TableHead className="hidden sm:table-cell">Idade</TableHead>
              <TableHead>Método de Entrada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeeds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum seed encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredSeeds.map((seed, i) => {
                const age = seed.birthDate
                  ? Math.abs(
                      new Date(Date.now() - new Date(seed.birthDate).getTime()).getUTCFullYear() -
                        1970,
                    )
                  : 0
                return (
                  <TableRow
                    key={seed.id}
                    className="animate-fade-in hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border hidden sm:block">
                          <AvatarImage src={pbFileUrl(seed, seed.photo)} alt={seed.name} />
                          <AvatarFallback>{seed.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-base truncate">{seed.name}</span>
                          <span className="text-xs text-muted-foreground sm:hidden truncate">
                            {age} anos
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{age} anos</TableCell>
                    <TableCell>{seed.entryMethod}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        Ver Perfil
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
