import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore, AVAILABLE_USERS } from '@/store/authStore'
import { Maximize, Minimize } from 'lucide-react'

// Build timestamp - updated at compile time
const BUILD_TIMESTAMP = new Date().toISOString()

interface LoginScreenProps {
  onPasswordCorrect: () => void
  onError: (message: string) => void
}

export function LoginScreen({ onPasswordCorrect, onError }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const login = useAuthStore(state => state.login)

  // Rate limiting constants
  const MAX_ATTEMPTS = 5
  const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

  // Check if still locked out
  const isLocked = !!(lockedUntil && Date.now() < lockedUntil)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if locked out
    if (isLocked) {
      const remainingTime = Math.ceil((lockedUntil! - Date.now()) / 1000 / 60)
      onError(`Too many failed attempts. Try again in ${remainingTime} minutes.`)
      return
    }

    // Validate inputs
    if (!username.trim()) {
      onError('Please select a username')
      return
    }

    if (!password.trim()) {
      onError('Please enter a password')
      return
    }

    setIsLoading(true)

    try {
      // Attempt login with hashed password
      await login(username, password)

      // Reset attempts on successful login
      setAttempts(0)
      setLockedUntil(null)
      onPasswordCorrect()
    } catch (error) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_TIME
        setLockedUntil(lockoutEnd)
        onError(`Too many failed attempts. Locked for 15 minutes.`)
      } else {
        const message = error instanceof Error ? error.message : 'Login failed'
        onError(`${message} (${newAttempts}/${MAX_ATTEMPTS} attempts)`)
      }

      setPassword('')
    } finally {
      setIsLoading(false)
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

  // Development bypass - logs in as first user without password
  const handleDevBypass = () => {
    useAuthStore.setState({
      currentUser: {
        name: AVAILABLE_USERS[0], // Martin
        loginTime: new Date().toISOString(),
      },
      isAuthenticated: true,
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Development bypass button - Only visible in dev mode */}
      {import.meta.env.DEV && (
        <button
          onClick={handleDevBypass}
          className="absolute top-4 left-4 px-3 py-1.5 text-xs rounded-md bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 transition-colors border border-yellow-500/50"
          aria-label="Dev bypass"
          title="Development mode: Skip login as Martin"
        >
          🔓 DEV LOGIN
        </button>
      )}

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

      <div className="w-full max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username dropdown */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Select User
            </label>
            <select
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLocked || isLoading}
              required
            >
              <option value="">Choose your name...</option>
              {AVAILABLE_USERS.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder={isLocked ? "Locked - Too many attempts" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg"
              autoComplete="off"
              disabled={isLocked || isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLocked || isLoading}
          >
            {isLoading ? 'Logging in...' : isLocked ? 'Locked' : 'Login'}
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
