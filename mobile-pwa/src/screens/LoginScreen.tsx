import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, verifyMfa, getMe } from '../api/auth'
import { useAuthStore } from '../store/auth.store'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const [mode, setMode] = useState<'credentials' | 'mfa'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.mfa && res.auth) {
        setAuthToken(res.auth)
        setMode('mfa')
      } else if (res.token) {
        setToken(res.token)
        const me = await getMe()
        setUser(me)
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleMfa = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyMfa(authToken, otp)
      setToken(res.token)
      const me = await getMe()
      setUser(me)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-6 pt-[env(safe-area-inset-top)]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Trudesk</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to continue</p>
      </div>

      {mode === 'credentials' ? (
        <form onSubmit={handleCredentials} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMfa} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Enter the 6-digit code from your authenticator app.</p>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" onClick={() => setMode('credentials')} className="w-full text-sm text-gray-500 dark:text-gray-400 py-2">
            Back to login
          </button>
        </form>
      )}
    </div>
  )
}
