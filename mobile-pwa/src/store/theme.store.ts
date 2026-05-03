import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'system' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'td_pwa_theme' }
  )
)
