import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Church, LogOut } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SelectChurch() {
  const { availableChurches, setCurrentChurch, loadingChurches } = useChurch()
  const selectableChurches = availableChurches
    .filter((c: any) => !c.event_host)
    .sort((a, b) => a.name.localeCompare(b.name))
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [selectedChurchId, setSelectedChurchId] = useState<string>('')

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/', { replace: true })
      return
    }
    if (!loadingChurches && selectableChurches.length === 1) {
      setCurrentChurch(selectableChurches[0])
      navigate('/', { replace: true })
    }
  }, [selectableChurches, loadingChurches, navigate, setCurrentChurch, user])

  const handleContinue = () => {
    const church = selectableChurches.find((c) => c.id === selectedChurchId)
    if (church) {
      setCurrentChurch(church)
      navigate('/', { replace: true })
    }
  }

  if (loadingChurches) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (selectableChurches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-lg animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle>Sem Acesso</CardTitle>
            <CardDescription>
              Sua conta não está vinculada a nenhuma igreja. Contate um administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => signOut()} variant="outline">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in-up border-primary/20">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Church className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Selecionar Igreja</CardTitle>
          <CardDescription>Escolha o contexto que deseja acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleContinue()
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Select value={selectedChurchId} onValueChange={setSelectedChurchId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja..." />
                </SelectTrigger>
                <SelectContent>
                  {selectableChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={!selectedChurchId}>
              Continuar
            </Button>
          </form>

          <div className="pt-4 mt-6 border-t text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
