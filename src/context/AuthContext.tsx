import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

export interface Permission {
  feature: string
  action: string
}

export interface UserRole {
  id: string
  name: string
  description: string
  isSystemRole: boolean
}

export interface AuthUser {
  id: string
  email: string
  username: string
  fullName: string
  phone: string | null
  role: UserRole
  status: string
  permissions: Permission[]
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEYS = {
  ACCESS_TOKEN: '_ssms_access_token',
  REFRESH_TOKEN: '_ssms_refresh_token',
  USER: '_ssms_user',
} as const

const { ACCESS_TOKEN, REFRESH_TOKEN, USER } = STORAGE_KEYS

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(ACCESS_TOKEN)
  )

  const login = useCallback((user: AuthUser, accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken)
    localStorage.setItem(REFRESH_TOKEN, refreshToken)
    localStorage.setItem(USER, JSON.stringify(user))
    setUser(user)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
    localStorage.removeItem(USER)
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
