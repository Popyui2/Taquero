import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_PASSWORD } from '@/store/authStore'
import { Maximize, Minimize } from 'lucide-react'

interface LoginScreenProps {
  onPasswordCorrect: () => void
  onError: (message: string) => void
}

export function LoginScreen({ onPasswordCorrect, onError }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === APP_PASSWORD) {
      onPasswordCorrect()
    } else {
      onError('Incorrect password')
      setPassword('')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Maximize className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

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
