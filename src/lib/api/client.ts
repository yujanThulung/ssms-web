// src/lib/api/client.ts
import axios, { type AxiosRequestConfig } from 'axios'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '_ssms_access_token',
  REFRESH_TOKEN: '_ssms_refresh_token',
  USER: '_ssms_user',
} as const

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = getTokenExpiry(token)
  if (exp === null) return true
  return Date.now() / 1000 >= exp - bufferSeconds
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to outgoing requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh queue
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

export function forceLogout() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Response interceptor — reactive 401 handling
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const alreadyRetried = original?._retry
    const isPublicAuthEndpoint =
      original?.url?.includes('auth/login') ||
      original?.url?.includes('auth/register') ||
      original?.url?.includes('auth/forgot-password') ||
      original?.url?.includes('auth/refresh')

    // 1. If it's NOT a 401, or it's a public auth endpoint, pass the error to the UI
    if (!is401 || isPublicAuthEndpoint) {
      const message = error.response?.data?.message ?? error.message
      return Promise.reject(new Error(message))
    }

    // 2. If it was already retried and still got 401, force logout immediately!
    if (alreadyRetried) {
      forceLogout()
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }

    // 3. If another request is currently refreshing the token, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${token}`,
          }
          return client(original)
        })
        .catch((err) => {
          forceLogout()
          return Promise.reject(err)
        })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

    // 4. If refresh token is missing or expired, force logout immediately
    if (!refreshToken || isTokenExpired(refreshToken)) {
      isRefreshing = false
      processQueue(new Error('Session expired'), null)
      forceLogout()
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }

    // 5. Try refreshing the access token
    try {
      const { data: resBody } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refreshToken }
      )

      const payload = resBody?.data ?? resBody
      const newAccessToken: string =
        payload?.accessToken || payload?.access_token

      const newRefreshToken: string =
        payload?.refreshToken || payload?.refresh_token

      if (!newAccessToken) {
        throw new Error('No access token in refresh response')
      }

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
      if (newRefreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
      }
      client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

      processQueue(null, newAccessToken)

      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newAccessToken}`,
      }
      return client(original)
    } catch (err) {
      processQueue(err, null)
      forceLogout()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
