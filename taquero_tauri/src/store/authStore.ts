import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (userName: string, password: string) => Promise<boolean>
  logout: () => void
}

// Hash function using Web Crypto API (works in browser)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Get password hash from environment variable
// For security: NEVER hardcode the actual password or hash in production
const VALID_PASSWORD_HASH = import.meta.env.VITE_APP_PASSWORD_HASH ||
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // Empty string hash (development only)

const AVAILABLE_USERS = ['Martin', 'Andres', 'Hugo', 'Marcela', 'Temp Employee']

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      login: async (userName: string, password: string): Promise<boolean> => {
        // Validate username first
        if (!AVAILABLE_USERS.includes(userName)) {
          throw new Error('Invalid username')
        }

        try {
          // Hash the provided password
          const passwordHash = await hashPassword(password)

          // Compare with stored hash
          if (passwordHash === VALID_PASSWORD_HASH) {
            set({
              currentUser: {
                name: userName,
                loginTime: new Date().toISOString(),
              },
              isAuthenticated: true,
            })
            return true
          } else {
            throw new Error('Invalid password')
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw error
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        })
        // Clear localStorage session data
        localStorage.removeItem('taquero-auth')
      },
    }),
    {
      name: 'taquero-auth',
    }
  )
)

export { AVAILABLE_USERS }
