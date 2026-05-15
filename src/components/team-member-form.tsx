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
    status: z.enum(['Em progresso', 'Completo', 'Não feito']),
    completionYear: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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
  photoUrl: z.string().url('URL inválida').or(z.literal('')),
  email: z.string().email('Email inválido').or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  role: z.enum(['Líder', 'Membro']),
  courses: z.object({
    cme: courseSchema,
    ebm: courseSchema,
    te: courseSchema,
  }),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  initialData?: TeamMember
  onSubmit: (data: Omit<TeamMember, 'id'>) => void
  onCancel: () => void
}

const COURSES = [
  { key: 'cme', label: 'CME' },
  { key: 'ebm', label: 'EBM' },
  { key: 'te', label: 'TE' },
] as const

export function TeamMemberForm({ initialData, onSubmit, onCancel }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      photoUrl: '',
      email: '',
      dateOfBirth: '',
      role: 'Membro',
      courses: {
        cme: { status: 'Não feito', completionYear: '' },
        ebm: { status: 'Não feito', completionYear: '' },
        te: { status: 'Não feito', completionYear: '' },
      },
    },
  })

  const handleSubmit = (values: FormValues) => {
    // Ensures completionYear is stored only when status is Completo
    const cleanCourses = { ...values.courses }
    COURSES.forEach(({ key }) => {
      if (cleanCourses[key].status !== 'Completo') {
        cleanCourses[key].completionYear = undefined
      }
    })
    onSubmit({ ...values, courses: cleanCourses })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                <FormLabel>Data Nasc.</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto URL</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Função</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Líder">Líder</SelectItem>
                    <SelectItem value="Membro">Membro</SelectItem>
                  </SelectContent>
                </Select>
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
  courseKey: 'cme' | 'ebm' | 'te'
  label: string
  form: any
}) {
  const status = useWatch({ control: form.control, name: `courses.${courseKey}.status` })

  return (
    <div className="flex gap-4 items-start">
      <FormField
        control={form.control}
        name={`courses.${courseKey}.status`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel className="sr-only">{label} Status</FormLabel>
            <div className="flex items-center gap-2">
              <span className="w-10 text-sm font-semibold">{label}</span>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
            <FormItem className="w-32 animate-fade-in">
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
