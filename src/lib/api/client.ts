import axios, { type AxiosRequestConfig } from 'axios'
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '_ssms_access_token',
  REFRESH_TOKEN: '_ssms_refresh_token',
  USER: '_ssms_user',
} as const

// ------jwt helper --------
// Extracts and returns the JWT expiration time (exp) from the token, or null if the token is invalid.
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch (error) {
    return null
  }
}

function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = getTokenExpiry(token)
  if (exp === null) return false
  return Date.now() / 1000 >= exp - bufferSeconds
}


//  axios instance
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// refresh queue
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) =>
    error ? p.reject(error) : p.resolve(token!)
  )
  failedQueue = []
}

//Force logut
function forceLogout() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  window.location.href = '/login'
}

//Response interceptor — reactive 401 handling

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const alreadyRetried = original._retry
    const isRefreshEndpoint = original.url?.includes('auth/refresh')

    if (!is401 || alreadyRetried || isRefreshEndpoint) {
      const message = error.response?.data?.message ?? error.message
      return Promise.reject(new Error(message))
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          original.headers = {
            ...original.headers,
            Authorization: `Beerer ${token}`,
          }
          return client(original)
        })
        .catch((err) => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

    // refresh token missing or expired
    if (!refreshToken || isTokenExpired(refreshToken)) {
      isRefreshing = false
      processQueue(new Error('Session expired'), null)
      forceLogout()
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refreshToken }
      )

      const newAccessToken: string = data.ACCESS_TOKEN

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

      processQueue(null, newAccessToken)

      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newAccessToken}`,
      }
      return client(original)
    } catch (error) {
      processQueue(refreshToken, null)
      forceLogout()
      return Promise.reject(refreshToken)
    } finally {
      isRefreshing = false
    }
  }
)

export default client