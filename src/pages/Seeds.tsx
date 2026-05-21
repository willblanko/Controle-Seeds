import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  User as UserIcon,
  Trash2,
  Upload,
  Loader2,
  Download,
  Eye,
  Pencil,
} from 'lucide-react'

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
import { SeedForm } from '@/components/seed-form'

export default function Seeds() {
  const { currentChurch, availableChurches } = useChurch()
  const [search, setSearch] = useState('')
  const [seeds, setSeeds] = useState<any[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
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

  const handleAddSeed = async (data: any) => {
    if (!currentChurch) return
    try {
      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        if (key === 'photoUrl' && data[key] instanceof File) {
          formData.append('photo', data[key])
        } else if (data[key] !== undefined && key !== 'photoUrl') {
          formData.append(key, data[key].toString())
        }
      })
      formData.append('church', currentChurch.id)
      formData.append('registrationDate', new Date().toISOString().split('T')[0])

      await pb.collection('seeds').create(formData)
      await loadData()
      setIsCreateOpen(false)
      toast({ title: 'Seed adicionado.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleUpdateSeed = async (data: any) => {
    if (!selectedSeed) return
    try {
      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        if (key === 'photoUrl' && data[key] instanceof File) {
          formData.append('photo', data[key])
        } else if (data[key] !== undefined && key !== 'photoUrl') {
          formData.append(key, data[key].toString())
        }
      })
      const updated = await pb.collection('seeds').update(selectedSeed.id, formData)
      await loadData()
      setIsEditMode(false)
      setSelectedSeed(updated)
      toast({ title: 'Seed atualizado.' })
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
          errors.push(`Linha ${i + 1}: 'Nome' é obrigatório.`)
          continue
        }
        if (!row['DataNascimento']) {
          errors.push(`Linha ${i + 1}: 'DataNascimento' é obrigatório.`)
          continue
        }
        if (!row['Responsavel1']) {
          errors.push(`Linha ${i + 1}: 'Responsavel1' é obrigatório.`)
          continue
        }
        if (!row['Telefone1']) {
          errors.push(`Linha ${i + 1}: 'Telefone1' é obrigatório.`)
          continue
        }

        let dob = ''
        const rawDob = row['DataNascimento']
        if (rawDob) {
          const parts = rawDob.split('/')
          if (parts.length === 3)
            dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          else dob = rawDob
        }

        const seedData = {
          church: churchMatch.id,
          name: row['Nome'],
          entryMethod: row['MetodoEntrada'] || 'Novo Membro',
          sex: row['Sexo'] || 'Masculino',
          birthDate: dob,
          guardian1: row['Responsavel1'],
          guardian2: row['Responsavel2'] || '',
          phone1: row['Telefone1'],
          phone2: row['Telefone2'] || '',
          hasAllergy: row['TemAlergia'] === 'Sim',
          allergyDetails: row['DetalhesAlergia'] || '',
          hasMedication: row['TemMedicacao'] === 'Sim',
          medicationDetails: row['DetalhesMedicacao'] || '',
          notes: row['Observacoes'] || '',
          registrationDate: new Date().toISOString().split('T')[0],
        }

        try {
          await pb.collection('seeds').create(seedData)
          successCount++
        } catch (e: any) {
          errors.push(`Linha ${i + 1}: ${e.message}`)
        }
      }

      await loadData()
      if (errors.length > 0) {
        setImportErrors(errors)
      } else {
        toast({ title: 'Importação concluída', description: `${successCount} seeds importados.` })
        setIsImportOpen(false)
        setImportFile(null)
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
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
          <h1 className="text-3xl font-bold tracking-tight">Seeds</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de seeds da sua igreja.</p>
        </div>
        <div className="flex items-center gap-2">
          <ChurchSelector allowGlobal={false} />
          <Button
            variant="outline"
            className="shrink-0 hidden md:flex"
            onClick={() => {
              const csvContent =
                'Nome;DataNascimento;Igreja;Sexo;MetodoEntrada;Responsavel1;Telefone1;Responsavel2;Telefone2;TemAlergia;DetalhesAlergia;TemMedicacao;DetalhesMedicacao;Observacoes\nExemplo Seed;01/01/2010;Sede;Masculino;Novo Membro;Pai;11999999999;;;Não;;Não;;\n'
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.setAttribute('href', url)
              link.setAttribute('download', 'modelo_seeds.csv')
              link.click()
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Baixar Modelo
          </Button>
          <Dialog
            open={isImportOpen}
            onOpenChange={(o) => {
              setIsImportOpen(o)
              setImportErrors([])
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0" variant="outline">
                <Upload className="h-4 w-4" />
                <span>Importar Seeds</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Seeds</DialogTitle>
                <DialogDescription>Selecione um arquivo CSV com os dados.</DialogDescription>
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
                <div className="py-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Fechar
                </Button>
                {importErrors.length === 0 && (
                  <Button onClick={handleImport} disabled={!importFile || isImporting}>
                    {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Importar
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span>Novo Seed</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Seed</DialogTitle>
              </DialogHeader>
              <SeedForm onSubmit={handleAddSeed} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSeed(seed)}>
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

      <Dialog
        open={!!selectedSeed}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSeed(null)
            setIsEditMode(false)
          }
        }}
      >
        {selectedSeed && (
          <DialogContent className="max-w-2xl">
            {isEditMode ? (
              <>
                <DialogHeader>
                  <DialogTitle>Editar Seed</DialogTitle>
                </DialogHeader>
                <SeedForm
                  initialData={selectedSeed}
                  onSubmit={handleUpdateSeed}
                  onCancel={() => setIsEditMode(false)}
                />
              </>
            ) : (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Perfil do Seed</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border">
                      <AvatarImage src={pbFileUrl(selectedSeed, selectedSeed.photo)} />
                      <AvatarFallback>{selectedSeed.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-xl">{selectedSeed.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedSeed.entryMethod}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Idade</span>
                      <span className="font-medium">
                        {Math.abs(
                          new Date(
                            Date.now() - new Date(selectedSeed.birthDate).getTime(),
                          ).getUTCFullYear() - 1970,
                        )}{' '}
                        anos
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Sexo</span>
                      <span className="font-medium">{selectedSeed.sex}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Responsável 1</span>
                      <span className="font-medium">
                        {selectedSeed.guardian1} ({selectedSeed.phone1})
                      </span>
                    </div>
                    {selectedSeed.guardian2 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Responsável 2</span>
                        <span className="font-medium">
                          {selectedSeed.guardian2} ({selectedSeed.phone2})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedSeed.hasAllergy && (
                      <div className="flex flex-col">
                        <span className="text-red-500 font-semibold">Alergia</span>
                        <span className="font-medium">{selectedSeed.allergyDetails}</span>
                      </div>
                    )}
                    {selectedSeed.hasMedication && (
                      <div className="flex flex-col">
                        <span className="text-blue-500 font-semibold">Medicação</span>
                        <span className="font-medium">{selectedSeed.medicationDetails}</span>
                      </div>
                    )}
                  </div>
                  {selectedSeed.notes && (
                    <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-200">
                      <span className="font-semibold block mb-1">Observações:</span>
                      {selectedSeed.notes}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
