import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/user'
import { TOKEN_KEY } from '../api/axios'
import { getMe } from '../api/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token)
        set({ token, isAuthenticated: true })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        set({ token: null, user: null, isAuthenticated: false, isHydrated: true })
      },
      hydrate: async () => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) {
          set({ isHydrated: true, isAuthenticated: false })
          return
        }
        set({ isLoading: true })
        try {
          const user = await getMe()
          set({ user, isAuthenticated: true, isLoading: false, isHydrated: true })
        } catch {
          localStorage.removeItem(TOKEN_KEY)
          set({ token: null, user: null, isAuthenticated: false, isLoading: false, isHydrated: true })
        }
      },
    }),
    {
      name: 'td_pwa_auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
