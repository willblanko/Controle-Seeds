import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import logoImg from '@/assets/logoseedsgreen-bc966.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/' : '/select-church'} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError('Credenciais inválidas.')
      setIsSubmitting(false)
    } else {
      const currentUser = pb.authStore.record
      navigate(currentUser?.role === 'admin' ? '/' : '/select-church')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto flex justify-center w-full max-w-[240px] mb-4">
            <img
              src={logoImg}
              alt="Brand Logo"
              className="h-16 sm:h-20 w-auto object-contain transition-all duration-300 hover:scale-105"
            />
          </div>
          <CardDescription className="text-base px-2">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>{' '}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
