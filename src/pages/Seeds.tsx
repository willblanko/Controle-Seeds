import { useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useApp, Seed } from '@/contexts/app-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const seedSchema = z
  .object({
    name: z.string().min(3, 'Mínimo de 3 caracteres'),
    photo: z.any().optional(),
    entryMethod: z.enum(['Kids 4', 'Novo Membro', 'Convidado por Membro']),
    sex: z.enum(['Masculino', 'Feminino', 'Outro']),
    birthDate: z.string().min(10, 'Data obrigatória'),
    guardian1: z.string().min(3, 'Obrigatório'),
    guardian2: z.string().optional(),
    phone1: z.string().min(10, 'Obrigatório'),
    phone2: z.string().optional(),
    hasAllergy: z.enum(['yes', 'no']),
    allergyDetails: z.string().optional(),
    hasMedication: z.enum(['yes', 'no']),
    medicationDetails: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.hasAllergy === 'yes' && (!data.allergyDetails || data.allergyDetails.trim() === ''))
        return false
      return true
    },
    { message: 'Especifique a alergia', path: ['allergyDetails'] },
  )
  .refine(
    (data) => {
      if (
        data.hasMedication === 'yes' &&
        (!data.medicationDetails || data.medicationDetails.trim() === '')
      )
        return false
      return true
    },
    { message: 'Especifique a medicação', path: ['medicationDetails'] },
  )

export default function Seeds() {
  const { seeds, addSeed } = useApp()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [openNew, setOpenNew] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSex, setFilterSex] = useState<string>('all')
  const [filterEntry, setFilterEntry] = useState<string>('all')

  const allAllergies = useMemo(
    () =>
      Array.from(
        new Set(
          seeds.filter((s) => s.hasAllergy && s.allergyDetails).map((s) => s.allergyDetails!),
        ),
      ),
    [seeds],
  )
  const allMedications = useMemo(
    () =>
      Array.from(
        new Set(
          seeds
            .filter((s) => s.hasMedication && s.medicationDetails)
            .map((s) => s.medicationDetails!),
        ),
      ),
    [seeds],
  )

  const form = useForm<z.infer<typeof seedSchema>>({
    resolver: zodResolver(seedSchema),
    defaultValues: {
      name: '',
      entryMethod: 'Kids 4',
      sex: 'Masculino',
      birthDate: '',
      guardian1: '',
      guardian2: '',
      phone1: '',
      phone2: '',
      hasAllergy: 'no',
      allergyDetails: '',
      hasMedication: 'no',
      medicationDetails: '',
      notes: '',
    },
  })

  const filteredSeeds = seeds.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.guardian1.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchSex = filterSex === 'all' || s.sex === filterSex
    const matchEntry = filterEntry === 'all' || s.entryMethod === filterEntry

    return matchSearch && matchStatus && matchSex && matchEntry
  })

  const hasActiveFilters = filterStatus !== 'all' || filterSex !== 'all' || filterEntry !== 'all'
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterSex('all')
    setFilterEntry('all')
  }

  function onSubmit(data: z.infer<typeof seedSchema>) {
    const generatedPhoto = `https://img.usecurling.com/ppl/thumbnail?gender=${data.sex === 'Feminino' ? 'female' : 'male'}&seed=${Math.random().toString().substring(2, 6)}`

    addSeed({
      name: data.name,
      photo: generatedPhoto,
      entryMethod: data.entryMethod,
      sex: data.sex,
      birthDate: data.birthDate,
      guardian1: data.guardian1,
      guardian2: data.guardian2,
      phone1: data.phone1,
      phone2: data.phone2,
      hasAllergy: data.hasAllergy === 'yes',
      allergyDetails: data.hasAllergy === 'yes' ? data.allergyDetails : undefined,
      hasMedication: data.hasMedication === 'yes',
      medicationDetails: data.hasMedication === 'yes' ? data.medicationDetails : undefined,
      notes: data.notes,
    })

    setOpenNew(false)
    form.reset()
    toast({
      title: 'Sucesso',
      description: 'Seed cadastrado com sucesso!',
    })
  }

  return (
    <div className="space-y-6">
      <datalist id="allergies-list">
        {allAllergies.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <datalist id="medications-list">
        {allMedications.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Diretório de Seeds</h2>
          <p className="text-muted-foreground">Gerencie os alunos cadastrados no sistema.</p>
        </div>

        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Novo Seed
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Cadastrar Novo Seed</SheetTitle>
              <SheetDescription>
                Preencha os detalhes para registrar um novo aluno.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João da Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Foto (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => onChange(e.target.value)}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Ingresso</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Kids 4">Kids 4</SelectItem>
                              <SelectItem value="Novo Membro">Novo Membro</SelectItem>
                              <SelectItem value="Convidado por Membro">
                                Convidado por Membro
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">
                    Contato & Responsáveis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardian1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone 1</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardian2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável 2 (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone 2 (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">
                    Dados Médicos
                  </h3>
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="hasAllergy"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Possui alguma alergia?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="yes" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Sim</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="no" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Não</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('hasAllergy') === 'yes' && (
                        <FormField
                          control={form.control}
                          name="allergyDetails"
                          render={({ field }) => (
                            <FormItem className="animate-fade-in-up">
                              <FormLabel>Qual alergia?</FormLabel>
                              <FormControl>
                                <Input
                                  list="allergies-list"
                                  placeholder="Ex: Amendoim, Poeira..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="hasMedication"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Toma medicação contínua?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="yes" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Sim</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="no" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Não</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('hasMedication') === 'yes' && (
                        <FormField
                          control={form.control}
                          name="medicationDetails"
                          render={({ field }) => (
                            <FormItem className="animate-fade-in-up">
                              <FormLabel>Qual medicação?</FormLabel>
                              <FormControl>
                                <Input
                                  list="medications-list"
                                  placeholder="Ex: Ritalina..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Qualquer detalhe importante..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Salvar Cadastro
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou responsável..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSex} onValueChange={setFilterSex}>
            <SelectTrigger className="w-full sm:w-[140px] bg-card">
              <SelectValue placeholder="Sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (Sexo)</SelectItem>
              <SelectItem value="Masculino">Menino</SelectItem>
              <SelectItem value="Feminino">Menina</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEntry} onValueChange={setFilterEntry}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <SelectValue placeholder="Forma de Ingresso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Formas</SelectItem>
              <SelectItem value="Kids 4">Kids 4</SelectItem>
              <SelectItem value="Novo Membro">Novo Membro</SelectItem>
              <SelectItem value="Convidado por Membro">Convidado por Membro</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="px-2 lg:px-3 text-muted-foreground hover:text-foreground shrink-0 w-full sm:w-auto"
            >
              Limpar Filtros
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Ingresso</TableHead>
              <TableHead className="hidden sm:table-cell">Contato Principal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeeds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum seed encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredSeeds.map((seed, i) => (
                <TableRow
                  key={seed.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 hidden sm:block">
                        <AvatarImage src={seed.photo} />
                        <AvatarFallback>{seed.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{seed.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {seed.entryMethod}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm">{seed.guardian1}</span>
                      <span className="text-xs text-muted-foreground">{seed.phone1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={seed.status === 'Ativo' ? 'default' : 'secondary'}
                      className="font-normal"
                    >
                      {seed.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSeed(seed)}>
                      Ver Perfil
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSeed} onOpenChange={(open) => !open && setSelectedSeed(null)}>
        {selectedSeed && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Perfil do Seed</DialogTitle>
              <DialogDescription>
                Detalhes completos e informações médicas do aluno.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedSeed.photo} />
                  <AvatarFallback>{selectedSeed.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-xl">{selectedSeed.name}</span>
                  <div className="flex gap-2">
                    <Badge variant={selectedSeed.status === 'Ativo' ? 'default' : 'secondary'}>
                      {selectedSeed.status}
                    </Badge>
                    <Badge variant="outline">{selectedSeed.entryMethod}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Responsável 1</span>
                  <span className="font-medium">
                    {selectedSeed.guardian1} <br /> {selectedSeed.phone1}
                  </span>
                </div>
                {selectedSeed.guardian2 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Responsável 2</span>
                    <span className="font-medium">
                      {selectedSeed.guardian2} <br /> {selectedSeed.phone2}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Data de Nascimento</span>
                  <span className="font-medium">
                    {new Date(selectedSeed.birthDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Sexo</span>
                  <span className="font-medium">{selectedSeed.sex}</span>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Alergias</span>
                    <span className="font-medium">
                      {selectedSeed.hasAllergy ? selectedSeed.allergyDetails : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Medicação Contínua</span>
                    <span className="font-medium">
                      {selectedSeed.hasMedication ? selectedSeed.medicationDetails : 'Nenhuma'}
                    </span>
                  </div>
                </div>

                {selectedSeed.notes && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-muted-foreground">Observações</span>
                    <span className="font-medium whitespace-pre-wrap">{selectedSeed.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
