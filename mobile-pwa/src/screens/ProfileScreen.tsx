import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  KeyIcon,
  PencilSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore, type Theme } from '../store/theme.store'
import { logout } from '../api/auth'
import { getViewData, saveProfile, updatePassword } from '../api/profile'
import Avatar from '../components/Avatar'
import BottomSheet from '../components/BottomSheet'

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
]

type Sheet = 'editProfile' | 'changePassword' | null

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
    </div>
  )
}

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user, setUser, logout: clearStore } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [sheet, setSheet] = useState<Sheet>(null)

  // Edit profile state
  const [fullname, setFullname] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Change password state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    await logout().catch(() => {})
    clearStore()
    navigate('/login', { replace: true })
  }

  const openEditProfile = () => {
    setFullname(user.fullname)
    setTitle(user.title ?? '')
    setSaveError('')
    setSheet('editProfile')
  }

  const openChangePassword = () => {
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setPwError('')
    setPwSuccess(false)
    setSheet('changePassword')
  }

  const handleSaveProfile = async () => {
    if (!fullname.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const { csrfToken } = await getViewData()
      const updated = await saveProfile(
        { _id: user._id, username: user.username, fullname: fullname.trim(), title: title.trim() || undefined },
        csrfToken
      )
      setUser({ ...user, ...updated })
      setSheet(null)
    } catch (e: any) {
      setSaveError(e?.response?.data?.error ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match.')
      return
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    setPwSaving(true)
    setPwError('')
    try {
      const { csrfToken } = await getViewData()
      await updatePassword(
        { _id: user._id, username: user.username, currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw },
        csrfToken
      )
      setPwSuccess(true)
      setTimeout(() => setSheet(null), 1800)
    } catch (e: any) {
      setPwError(e?.response?.data?.error ?? 'Failed to update password.')
    } finally {
      setPwSaving(false)
    }
  }

  const { role } = user
  const roleColor = role?.isAdmin
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : role?.isAgent
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 px-4 pt-10 pb-8 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5">
        <Avatar name={user.fullname} image={user.image} size="xl" />

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.fullname}</h1>
          {user.title && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.title}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
          {role?.name && (
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
              {role.name}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 px-4">

        {/* Account card */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
            Account
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {/* Username — read only */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">@{user.username}</span>
            </div>

            {/* Edit profile */}
            <button
              onClick={openEditProfile}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PencilSquareIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Edit Profile</span>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </button>

            {/* Change password */}
            <button
              onClick={openChangePassword}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <KeyIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Change Password</span>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </section>

        {/* Appearance card */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
            Appearance
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex divide-x divide-gray-100 dark:divide-gray-700">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 text-xs font-medium transition-colors ${
                    theme === value
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-semibold active:opacity-75 transition-opacity mt-1"
        >
          Sign Out
        </button>
      </div>

      {/* ── Edit Profile Sheet ───────────────────────────────── */}
      <BottomSheet open={sheet === 'editProfile'} onClose={() => setSheet(null)} title="Edit Profile">
        <div className="px-5 py-4 flex flex-col gap-4">
          <FieldInput
            label="Full Name"
            value={fullname}
            onChange={setFullname}
            placeholder="Your full name"
          />
          <FieldInput
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Support Engineer"
          />

          {saveError && (
            <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving || !fullname.trim()}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </BottomSheet>

      {/* ── Change Password Sheet ────────────────────────────── */}
      <BottomSheet open={sheet === 'changePassword'} onClose={() => setSheet(null)} title="Change Password">
        <div className="px-5 py-4 flex flex-col gap-4">
          {pwSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckIcon className="w-7 h-7 text-green-600 dark:text-green-400" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Password updated!</p>
            </div>
          ) : (
            <>
              <FieldInput
                label="Current Password"
                value={currentPw}
                onChange={setCurrentPw}
                type="password"
              />
              <FieldInput
                label="New Password"
                value={newPw}
                onChange={setNewPw}
                type="password"
              />
              <FieldInput
                label="Confirm New Password"
                value={confirmPw}
                onChange={setConfirmPw}
                type="password"
              />

              {pwError && (
                <p className="text-xs text-red-600 dark:text-red-400">{pwError}</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
