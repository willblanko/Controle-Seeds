import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { TeamMember } from '@/types/team'

const courseSchema = z
  .object({
    status: z.enum(['Em progresso', 'Completo', 'Não feito', 'Selecione']),
    completionYear: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'Selecione') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleção obrigatória',
        path: ['status'],
      })
    }
    if (data.status === 'Completo' && (!data.completionYear || data.completionYear.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ano obrigatório',
        path: ['completionYear'],
      })
    }
  })

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  photoUrl: z.any().optional(),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  role: z.enum(['Líder', 'Membro', 'Selecione']).refine((val) => val !== 'Selecione', {
    message: 'Seleção obrigatória',
  }),
  sex: z.enum(['Masculino', 'Feminino', 'Selecione']).refine((val) => val !== 'Selecione', {
    message: 'Seleção obrigatória',
  }),
  phone: z.string().optional(),
  entry_date: z.string().optional(),
  courses: z.object({
    ebm: courseSchema,
    te: courseSchema,
  }),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  initialData?: TeamMember
  onSubmit: (data: Omit<TeamMember, 'id' | 'church'>) => void
  onCancel: () => void
}

const COURSES = [
  { key: 'ebm', label: 'EBM*' },
  { key: 'te', label: 'TE*' },
] as const

export function TeamMemberForm({ initialData, onSubmit, onCancel }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      photoUrl: undefined,
      dateOfBirth: initialData?.dateOfBirth || '',
      role: initialData?.role || 'Selecione',
      sex: initialData?.sex || 'Selecione',
      phone: initialData?.phone || '',
      entry_date: initialData?.entry_date || '',
      courses: {
        ebm: {
          status: initialData?.courses?.ebm?.status || 'Selecione',
          completionYear: initialData?.courses?.ebm?.completionYear || '',
        },
        te: {
          status: initialData?.courses?.te?.status || 'Selecione',
          completionYear: initialData?.courses?.te?.completionYear || '',
        },
      },
    },
  })

  const handleSubmit = (values: FormValues) => {
    const cleanCourses = { ...values.courses } as any
    COURSES.forEach(({ key }) => {
      const k = key as 'ebm' | 'te'
      if (cleanCourses[k].status !== 'Completo') {
        cleanCourses[k].completionYear = undefined
      }
    })

    onSubmit({
      name: values.name,
      photoUrl: values.photoUrl || '',
      dateOfBirth: values.dateOfBirth,
      role: values.role as 'Líder' | 'Membro',
      sex: values.sex as 'Masculino' | 'Feminino',
      phone: values.phone,
      entry_date: values.entry_date,
      courses: cleanCourses,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome Completo*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Função*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Selecione">Selecione</SelectItem>
                    <SelectItem value="Líder">Líder</SelectItem>
                    <SelectItem value="Membro">Membro</SelectItem>
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
                    <SelectItem value="Selecione">Selecione</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês/Ano de Entrada</FormLabel>
                <FormControl>
                  <Input type="month" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Foto (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onChange(file)
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Progresso de Cursos</h4>
          {COURSES.map(({ key, label }) => (
            <CourseFieldRow key={key} courseKey={key} label={label} form={form} />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  )
}

function CourseFieldRow({
  courseKey,
  label,
  form,
}: {
  courseKey: 'ebm' | 'te'
  label: string
  form: any
}) {
  const status = useWatch({ control: form.control, name: `courses.${courseKey}.status` })

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
      <FormField
        control={form.control}
        name={`courses.${courseKey}.status`}
        render={({ field }) => (
          <FormItem className="w-full sm:flex-1">
            <FormLabel className="sr-only">{label}</FormLabel>
            <div className="flex items-center gap-2 w-full">
              <span className="w-12 shrink-0 text-sm font-semibold">{label}</span>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Selecione">Selecione</SelectItem>
                  <SelectItem value="Não feito">Não feito</SelectItem>
                  <SelectItem value="Em progresso">Em progresso</SelectItem>
                  <SelectItem value="Completo">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {status === 'Completo' && (
        <FormField
          control={form.control}
          name={`courses.${courseKey}.completionYear`}
          render={({ field }) => (
            <FormItem className="w-full sm:w-32 animate-fade-in">
              {' '}
              <FormControl>
                <Input placeholder="Ano..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
