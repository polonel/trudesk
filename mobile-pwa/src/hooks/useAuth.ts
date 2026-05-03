import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'
import { getMe, refreshToken } from '../api/auth'
import { TOKEN_KEY } from '../api/axios'

export function useAuth() {
  const { token, user, isAuthenticated, isLoading, setToken, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (!token || user) return

    const hydrate = async () => {
      try {
        const newToken = await refreshToken()
        setToken(newToken)
        const me = await getMe()
        setUser(me)
      } catch {
        logout()
      }
    }

    hydrate()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasToken = Boolean(localStorage.getItem(TOKEN_KEY))

  return { token, user, isAuthenticated: isAuthenticated || hasToken, isLoading, setToken, setUser, logout }
}
