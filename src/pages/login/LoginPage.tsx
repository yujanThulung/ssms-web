import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePost } from '../../lib/api'
import type { AuthUser } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import school from '../../assets/school.png'
import logo from '../../assets/logo.png'

interface LoginResponse {
  user: AuthUser
  access_token: string
  refresh_token: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = usePost<
    { emailOrUsername: string; password: string },
    LoginResponse
  >('/auth/login')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate(
      { emailOrUsername, password },
      {
        onSuccess: (data) => {
          login(data.user, data.access_token, data.refresh_token)
          navigate('/')
        },
        onError: (err) => {
          setError(err.message ?? 'Invalid credentials. Please try again.')
        },
      }
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* ── Left — image panel ───────────────────────────── */}
      <div className="relative hidden lg:flex flex-col overflow-hidden">
        {/* background image */}
        <img
          src={school}
          alt="School"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* dark gradient overlay — top and bottom, keeps center clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/70" />

        {/* top — logo */}
        <div className="relative z-10 flex items-center gap-2.5 p-8">
          <img src={logo} alt="SSMS Logo" className="h-10 w-10 rounded-lg object-contain" />
          <span className="text-base font-semibold text-white tracking-wide">SSMS</span>
        </div>

        {/* bottom — headline */}
        <div className="relative z-10 mt-auto p-10 pb-12">
          <h2
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-5xl font-extrabold text-white leading-tight"
          >
            School<br />Management<br />System
          </h2>
          <p
            style={{ fontFamily: "'Inter', sans-serif" }}
            className="mt-4 text-base text-zinc-300 max-w-xs leading-relaxed"
          >
            Manage students, staff, and operations in one place.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ───────────────────────────── */}
      <div className="flex flex-col min-h-svh bg-white">
        {/* mobile logo */}
        <div className="flex items-center gap-2 p-6 lg:hidden">
          <img src={logo} alt="SSMS Logo" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-semibold text-zinc-800">SSMS</span>
        </div>

        {/* centered form */}
        <div className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">

            {/* heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500">
                Sign in to your account to continue
              </p>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="your.username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900',
                    'outline-none transition',
                    'focus:border-green-700 focus:bg-white focus:ring-3 focus:ring-green-700/10',
                    'placeholder:text-zinc-400'
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900',
                    'outline-none transition',
                    'focus:border-green-700 focus:bg-white focus:ring-3 focus:ring-green-700/10',
                    'placeholder:text-zinc-400'
                  )}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  'w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white',
                  'hover:bg-green-800 active:bg-green-900',
                  'focus:outline-none focus:ring-3 focus:ring-green-700/30',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'transition-colors duration-150 mt-1'
                )}
              >
                {isPending ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* footer */}
        <p className="pb-6 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} SSMS. All rights reserved.
        </p>
      </div>

    </div>
  )
}
