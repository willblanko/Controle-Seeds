import { useState, useMemo } from 'react'
import { Plus, Search, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useApp, Seed } from '@/contexts/app-context'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
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
    name: z.string().min(1, 'Nome é obrigatório'),
    photo: z.any().optional(),
    entryMethod: z.enum(['Kids 4', 'Novo Membro', 'Convidado por Membro'], {
      required_error: 'Selecione uma opção',
      invalid_type_error: 'Selecione uma opção',
    }),
    sex: z.enum(['Masculino', 'Feminino'], {
      required_error: 'Selecione uma opção',
      invalid_type_error: 'Selecione uma opção',
    }),
    birthDate: z.string().min(1, 'Data obrigatória'),
    guardian1: z.string().optional(),
    guardian2: z.string().optional(),
    phone1: z.string().optional(),
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
  const { seeds, addSeed, updateSeed } = useApp()
  const { currentChurch } = useChurch()
  const { user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [openNew, setOpenNew] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null)

  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create')
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null)

  const [quickFilter, setQuickFilter] = useState<string>('all')

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
      entryMethod: undefined as any,
      sex: undefined as any,
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
    const matchChurch =
      user?.role === 'admin' && !currentChurch ? true : s.church === currentChurch?.id
    if (!matchChurch) return false

    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.guardian1.toLowerCase().includes(search.toLowerCase())

    let matchFilter = true
    switch (quickFilter) {
      case 'active':
        matchFilter = s.status === 'Ativo'
        break
      case 'inactive':
        matchFilter = s.status === 'Inativo'
        break
      case 'boys':
        matchFilter = s.sex === 'Masculino'
        break
      case 'girls':
        matchFilter = s.sex === 'Feminino'
        break
      case 'kids4':
        matchFilter = s.entryMethod === 'Kids 4'
        break
      case 'new_member':
        matchFilter = s.entryMethod === 'Novo Membro'
        break
      case 'guest':
        matchFilter = s.entryMethod === 'Convidado por Membro'
        break
      case 'all':
      default:
        matchFilter = true
        break
    }

    return matchSearch && matchFilter
  })

  function handleOpenCreate() {
    setSheetMode('create')
    setEditingSeedId(null)
    form.reset({
      name: '',
      entryMethod: undefined as any,
      sex: undefined as any,
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
    })
    setOpenNew(true)
  }

  function handleEditSeed(seed: Seed) {
    setSheetMode('edit')
    setEditingSeedId(seed.id)
    setSelectedSeed(null)
    form.reset({
      name: seed.name,
      photo: '', // File input cannot be programmatically populated with URL easily
      entryMethod: seed.entryMethod as any,
      sex: seed.sex as any,
      birthDate: seed.birthDate,
      guardian1: seed.guardian1,
      guardian2: seed.guardian2 || '',
      phone1: seed.phone1,
      phone2: seed.phone2 || '',
      hasAllergy: seed.hasAllergy ? 'yes' : 'no',
      allergyDetails: seed.allergyDetails || '',
      hasMedication: seed.hasMedication ? 'yes' : 'no',
      medicationDetails: seed.medicationDetails || '',
      notes: seed.notes || '',
    })
    setOpenNew(true)
  }

  async function onSubmit(data: z.infer<typeof seedSchema>) {
    if (sheetMode === 'create') {
      const generatedPhoto =
        data.photo ||
        `https://img.usecurling.com/ppl/thumbnail?gender=${data.sex === 'Feminino' ? 'female' : 'male'}&seed=${Math.random().toString().substring(2, 6)}`

      if (!currentChurch) {
        toast({
          title: 'Erro',
          description: 'Selecione uma igreja no menu lateral para cadastrar.',
          variant: 'destructive',
        })
        return
      }

      await addSeed({
        name: data.name,
        photo: generatedPhoto,
        entryMethod: data.entryMethod,
        sex: data.sex,
        birthDate: data.birthDate,
        guardian1: data.guardian1 || '',
        guardian2: data.guardian2,
        phone1: data.phone1 || '',
        phone2: data.phone2,
        hasAllergy: data.hasAllergy === 'yes',
        allergyDetails: data.hasAllergy === 'yes' ? data.allergyDetails : undefined,
        hasMedication: data.hasMedication === 'yes',
        medicationDetails: data.hasMedication === 'yes' ? data.medicationDetails : undefined,
        notes: data.notes,
      })
      toast({
        title: 'Sucesso',
        description: 'Seed cadastrado com sucesso!',
      })
    } else if (editingSeedId) {
      await updateSeed(editingSeedId, {
        name: data.name,
        ...(data.photo ? { photo: data.photo } : {}),
        entryMethod: data.entryMethod,
        sex: data.sex,
        birthDate: data.birthDate,
        guardian1: data.guardian1 || '',
        guardian2: data.guardian2,
        phone1: data.phone1 || '',
        phone2: data.phone2,
        hasAllergy: data.hasAllergy === 'yes',
        allergyDetails: data.hasAllergy === 'yes' ? data.allergyDetails : undefined,
        hasMedication: data.hasMedication === 'yes',
        medicationDetails: data.hasMedication === 'yes' ? data.medicationDetails : undefined,
        notes: data.notes,
      })
      toast({
        title: 'Sucesso',
        description: 'Seed atualizado com sucesso!',
      })
    }

    setOpenNew(false)
    form.reset()
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
          <p className="text-muted-foreground">Gerencie os Seeds cadastrados no sistema.</p>
        </div>

        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <Button className="shrink-0" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Seed
          </Button>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>
                {sheetMode === 'create' ? 'Cadastrar Novo Seed' : 'Editar Seed'}
              </SheetTitle>
              <SheetDescription>
                {sheetMode === 'create'
                  ? 'Preencha os detalhes para registrar um novo Seed.'
                  : 'Atualize as informações do Seed.'}
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
                          <FormLabel>Nome Completo*</FormLabel>
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
                          <FormLabel>Foto</FormLabel>
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
                          <FormLabel>Data de Nascimento*</FormLabel>
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
                          <FormLabel>Forma de Ingresso*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                          <FormLabel>Sexo*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
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
                          <FormLabel>Responsável 2</FormLabel>
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
                          <FormLabel>Telefone 2</FormLabel>
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
                  {sheetMode === 'create' ? 'Salvar Cadastro' : 'Salvar Alterações'}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome..."
            className="pl-9 bg-card rounded-lg border-slate-200 shadow-sm h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Ativos' },
            { id: 'inactive', label: 'Inativos' },
            { id: 'boys', label: 'Meninos' },
            { id: 'girls', label: 'Meninas' },
            { id: 'kids4', label: 'Kids 4' },
            { id: 'new_member', label: 'Novo Membro' },
            { id: 'guest', label: 'Convidado' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors border',
                quickFilter === f.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              {f.label}
            </button>
          ))}
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
              <div className="flex items-center justify-between">
                <DialogTitle>Perfil do Seed</DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => handleEditSeed(selectedSeed)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Detalhes completos e informações médicas do Seed.
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
