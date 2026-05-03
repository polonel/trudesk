import { useNavigate } from 'react-router-dom'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore, type Theme } from '../store/theme.store'
import { logout } from '../api/auth'
import Avatar from '../components/Avatar'

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
]

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user, logout: clearStore } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const handleLogout = async () => {
    await logout().catch(() => {})
    clearStore()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full pb-20 px-4 pt-8">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <Avatar name={user.fullname} image={user.image} size="md" />
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{user.fullname}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.role?.name}</p>
        </div>
      </div>

      {/* Theme selector */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Appearance</p>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                theme === value
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full mt-auto py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium"
      >
        Sign Out
      </button>
    </div>
  )
}
