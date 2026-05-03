import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) hydrate()
  }, [isHydrated, hydrate])

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
