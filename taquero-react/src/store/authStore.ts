import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (userName: string) => void
  logout: () => void
}

const APP_PASSWORD = '123456'
const AVAILABLE_USERS = ['Martin', 'Andres', 'Hugo', 'Marcela', 'Temp Employee']

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (userName: string) => {
        if (AVAILABLE_USERS.includes(userName)) {
          set({
            currentUser: {
              name: userName,
              loginTime: new Date().toISOString(),
            },
            isAuthenticated: true,
          })
        }
      },
      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'taquero-auth',
    }
  )
)

export { APP_PASSWORD, AVAILABLE_USERS }
