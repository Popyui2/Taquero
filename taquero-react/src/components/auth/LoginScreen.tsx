import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_PASSWORD } from '@/store/authStore'

interface LoginScreenProps {
  onPasswordCorrect: () => void
  onError: (message: string) => void
}

export function LoginScreen({ onPasswordCorrect, onError }: LoginScreenProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === APP_PASSWORD) {
      onPasswordCorrect()
    } else {
      onError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full text-center mb-12">
        <h1 className="login-title font-bold tracking-tight">
          Taquero
        </h1>
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 text-lg"
            autoComplete="off"
            autoFocus
          />
          <Button type="submit" className="w-full" size="lg">
            Login
          </Button>
        </form>
      </div>
    </div>
  )
}
