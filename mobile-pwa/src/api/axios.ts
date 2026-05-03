import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'td_pwa_token'

const api = axios.create({ withCredentials: true })

// Subscriber pattern — queue concurrent requests during token refresh
let isRefreshing = false
let subscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  subscribers.push(cb)
}

function onRefreshed(token: string) {
  subscribers.forEach(cb => cb(token))
  subscribers = []
}

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post('/api/v2/token', {}, { withCredentials: true })
  const token: string = res.data.token
  localStorage.setItem(TOKEN_KEY, token)
  return token
}

api.interceptors.request.use(async config => {
  let token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    try {
      const decoded = jwtDecode<{ exp: number }>(token)
      const isExpired = decoded.exp * 1000 < Date.now()

      if (isExpired) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            token = await refreshAccessToken()
            onRefreshed(token)
          } catch {
            // Force logout — navigate handled in response interceptor
            localStorage.removeItem(TOKEN_KEY)
            token = null
          } finally {
            isRefreshing = false
          }
        } else {
          token = await new Promise<string>(resolve => subscribeTokenRefresh(resolve))
        }
      }
    } catch {
      // Malformed token — proceed without it
      token = null
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/mobile/login'
    }
    return Promise.reject(err)
  }
)

export { TOKEN_KEY }
export default api
