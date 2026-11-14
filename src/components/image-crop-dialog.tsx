import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

/**
 * Modal de recorte de imagem em formato de avatar (quadrado).
 * Retorna o arquivo recortado (quadrado, 512x512) via onCropped,
 * ou apenas fecha o modal via onOpenChange(false) quando cancelado.
 */
export function ImageCropDialog({
  file,
  open,
  onCropped,
  onOpenChange,
}: {
  file: File | null
  open: boolean
  onCropped: (croppedFile: File) => void
  onOpenChange: (open: boolean) => void
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const readFile = useCallback((f: File) => {
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(f)
  }, [])

  // Recarrega sempre que um novo arquivo chega enquanto o modal está montado/aberto
  const lastFileRef = useRef<File | null>(null)
  if (file && file !== lastFileRef.current) {
    lastFileRef.current = file
    setImageSrc(null)
    readFile(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const onCropComplete = useCallback(
    (_: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    [],
  )

  const showCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height)
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      size,
      size,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )
    const ext = file?.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg'
    const name = (file?.name || 'foto').replace(/\.[^.]+$/, '')
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        onCropped(
          new File([blob], `${name}-recorte.${ext}`, {
            type: ext === 'png' ? 'image/png' : 'image/jpeg',
          }),
        )
        onOpenChange(false)
      },
      ext === 'png' ? 'image/png' : 'image/jpeg',
      0.9,
    )
  }, [imageSrc, croppedAreaPixels, file, onCropped, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ao fechar (cancelar ou X), nada é enviado — apenas limpa o estado
        if (!next) {
          setImageSrc(null)
          setCroppedAreaPixels(null)
          lastFileRef.current = null
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Mova a imagem e use o zoom para enquadrar o rosto dentro do círculo.
          </DialogDescription>
        </DialogHeader>

        {imageSrc ? (
          <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Carregando imagem...
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(values) => setZoom(values[0] ?? 1)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={showCroppedImage} disabled={!imageSrc || !croppedAreaPixels}>
            Confirmar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const OUTPUT_SIZE = 512

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (err) => reject(err))
    image.src = url
  })
}

export function useImageCrop() {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const pickFile = useCallback((raw: File) => {
    setPendingFile(raw)
    setCropOpen(true)
  }, [])

  return { pendingFile, cropOpen, setCropOpen, pickFile }
}
