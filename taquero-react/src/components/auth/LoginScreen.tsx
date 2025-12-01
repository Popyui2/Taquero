import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_PASSWORD } from '@/store/authStore'
import { Maximize, Minimize } from 'lucide-react'

// Build timestamp - updated at compile time
const BUILD_TIMESTAMP = new Date().toISOString()

interface LoginScreenProps {
  onPasswordCorrect: () => void
  onError: (message: string) => void
}

export function LoginScreen({ onPasswordCorrect, onError }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  // Rate limiting constants
  const MAX_ATTEMPTS = 5
  const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

  // Check if still locked out
  const isLocked = !!(lockedUntil && Date.now() < lockedUntil)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if locked out
    if (isLocked) {
      const remainingTime = Math.ceil((lockedUntil! - Date.now()) / 1000 / 60)
      onError(`Too many failed attempts. Try again in ${remainingTime} minutes.`)
      return
    }

    if (password === APP_PASSWORD) {
      // Reset attempts on successful login
      setAttempts(0)
      setLockedUntil(null)
      onPasswordCorrect()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_TIME
        setLockedUntil(lockoutEnd)
        onError(`Too many failed attempts. Locked for 15 minutes.`)
      } else {
        onError(`Incorrect password (${newAttempts}/${MAX_ATTEMPTS} attempts)`)
      }
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
            placeholder={isLocked ? "Locked - Too many attempts" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 text-lg"
            autoComplete="off"
            autoFocus
            disabled={isLocked}
          />
          <Button type="submit" className="w-full" size="lg" disabled={isLocked}>
            {isLocked ? "Locked" : "Login"}
          </Button>
        </form>
      </div>

      {/* Build version */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          Build: {new Date(BUILD_TIMESTAMP).toLocaleString('en-NZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </p>
      </div>
    </div>
  )
}
