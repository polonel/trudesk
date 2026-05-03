import axios from 'axios'
import api, { TOKEN_KEY } from './axios'
import type { User } from '../types/user'

export interface LoginResponse {
  token?: string
  mfa?: boolean
  auth?: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await axios.post('/api/v2/login', { username, password }, { withCredentials: true })
  return res.data
}

export async function verifyMfa(auth: string, code: string): Promise<{ token: string }> {
  const res = await axios.post('/verifymfa', { auth, otp: code }, { withCredentials: true })
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await api.get('/api/v2/login')
  return res.data
}

export async function logout(): Promise<void> {
  await api.get('/api/v2/logout')
  localStorage.removeItem(TOKEN_KEY)
}

export async function refreshToken(): Promise<string> {
  const res = await axios.post('/api/v2/token', {}, { withCredentials: true })
  const token: string = res.data.token
  localStorage.setItem(TOKEN_KEY, token)
  return token
}
