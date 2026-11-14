import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Church as ChurchIcon } from 'lucide-react'

interface ChurchSelectorProps {
  allowGlobal?: boolean
}

export function ChurchSelector({ allowGlobal = false }: ChurchSelectorProps) {
  const { currentChurch, availableChurches, setCurrentChurch } = useChurch()
  const { user } = useAuth()
  const location = useLocation()

  const selectableChurches = availableChurches
    .filter((c: any) => !c.event_host)
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    if (!allowGlobal && !currentChurch && selectableChurches.length > 0) {
      setCurrentChurch(selectableChurches[0])
    }
  }, [allowGlobal, currentChurch, selectableChurches, setCurrentChurch, location.pathname])

  if (user?.role !== 'admin' && selectableChurches.length <= 1) {
    return null
  }

  if (selectableChurches.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <ChurchIcon className="h-5 w-5 text-muted-foreground hidden sm:block" />
      <Select
        value={currentChurch?.id || 'all'}
        onValueChange={(val) =>
          setCurrentChurch(val === 'all' ? null : selectableChurches.find((c) => c.id === val)!)
        }
      >
        <SelectTrigger className="h-9 w-[220px] bg-background">
          <SelectValue placeholder="Selecione a igreja" />
        </SelectTrigger>
        <SelectContent>
          {allowGlobal && (
            <SelectItem value="all" className="font-semibold text-primary">
              Visão Global
            </SelectItem>
          )}
          {selectableChurches.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
