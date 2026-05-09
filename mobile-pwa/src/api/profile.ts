import api from './axios'
import type { User } from '../types/user'

export async function getViewData(): Promise<{ csrfToken: string }> {
  const res = await api.get('/api/v2/viewdata')
  return res.data.viewdata
}

export async function saveProfile(
  payload: { _id: string; username: string; fullname: string; title?: string },
  csrfToken: string
): Promise<User> {
  const res = await api.put('/api/v2/accounts/profile', payload, {
    headers: { 'CSRF-TOKEN': csrfToken },
  })
  return res.data.user
}

export async function updatePassword(
  payload: {
    _id: string
    username: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
  },
  csrfToken: string
): Promise<void> {
  await api.post('/api/v2/accounts/profile/update-password', payload, {
    headers: { 'CSRF-TOKEN': csrfToken },
  })
}
