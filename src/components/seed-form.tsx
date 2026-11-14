import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
import { ImageCropDialog, useImageCrop } from '@/components/image-crop-dialog'
import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  entryMethod: z.string().optional(),
  sex: z.string().optional(),
  birthDate: z.string().optional(),
  guardian1: z.string().optional(),
  guardian2: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  hasAllergy: z.boolean(),
  allergyDetails: z.string().optional(),
  hasMedication: z.boolean(),
  medicationDetails: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.any().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function SeedForm({ initialData, onSubmit, onCancel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      entryMethod: initialData?.entryMethod || '',
      sex: initialData?.sex || '',
      birthDate: initialData?.birthDate || '',
      guardian1: initialData?.guardian1 || '',
      guardian2: initialData?.guardian2 || '',
      phone1: initialData?.phone1 || '',
      phone2: initialData?.phone2 || '',
      hasAllergy: initialData?.hasAllergy || false,
      allergyDetails: initialData?.allergyDetails || '',
      hasMedication: initialData?.hasMedication || false,
      medicationDetails: initialData?.medicationDetails || '',
      notes: initialData?.notes || '',
      photoUrl: undefined,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[70vh] overflow-y-auto px-1"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo*</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
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
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        <FormField
          control={form.control}
          name="entryMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Entrada</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Kids 4">Kids 4</SelectItem>
                  <SelectItem value="Novo Membro">Novo Membro</SelectItem>
                  <SelectItem value="Convidado por Membro">Convidado por Membro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardian1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável 1</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardian2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável 2 (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 p-4 border rounded-md">
          <FormField
            control={form.control}
            name="hasAllergy"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Possui Alergia?</FormLabel>
              </FormItem>
            )}
          />
          {form.watch('hasAllergy') && (
            <FormField
              control={form.control}
              name="allergyDetails"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Detalhes da alergia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="hasMedication"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Toma Medicação?</FormLabel>
              </FormItem>
            )}
          />
          {form.watch('hasMedication') && (
            <FormField
              control={form.control}
              name="medicationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Detalhes da medicação..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <PhotoField control={form.control} name="photoUrl" />
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

function PhotoField({ control, name }: any) {
  const { pendingFile, cropOpen, setCropOpen, pickFile } = useImageCrop()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <FormItem>
          <FormLabel>Foto (opcional)</FormLabel>
          <FormControl>
            <div className="flex items-center gap-3">
              {preview ? (
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={preview} alt="Pré-visualização da foto" />
                  <AvatarFallback>F</AvatarFallback>
                </Avatar>
              ) : null}
              <Input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="w-auto flex-1"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  pickFile(file)
                  // reseta para permitir re-seleção do mesmo arquivo depois
                  e.target.value = ''
                }}
              />
              {preview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange(undefined)
                    setPreview(null)
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
          <ImageCropDialog
            file={pendingFile}
            open={cropOpen}
            onOpenChange={setCropOpen}
            onCropped={(cropped) => {
              onChange(cropped)
              setPreview(URL.createObjectURL(cropped))
            }}
          />
        </FormItem>
      )}
    />
  )
}
