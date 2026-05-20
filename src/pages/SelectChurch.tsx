import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChurch } from '@/contexts/church-context'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Church, LogOut } from 'lucide-react'

export default function SelectChurch() {
  const { availableChurches, setCurrentChurch, loadingChurches } = useChurch()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loadingChurches && availableChurches.length === 1) {
      setCurrentChurch(availableChurches[0])
      navigate('/', { replace: true })
    }
  }, [availableChurches, loadingChurches, navigate, setCurrentChurch])

  const handleSelect = (church: any) => {
    setCurrentChurch(church)
    navigate('/', { replace: true })
  }

  if (loadingChurches) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (availableChurches.length === 0) {
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
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {availableChurches.map((church) => (
              <Button
                key={church.id}
                variant="outline"
                className="h-auto py-4 justify-start text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => handleSelect(church)}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-base">{church.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">ID: {church.id}</span>
                </div>
              </Button>
            ))}
          </div>
          <div className="pt-4 border-t text-center mt-2">
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
