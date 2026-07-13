import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function Login() {
  const { session, signIn, loading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/estate-photo.jpg')" }}
      />
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-[2px]" />

      <button
        onClick={toggleTheme}
        className="btn-secondary !px-3 !py-2 absolute top-5 right-5 z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm animate-fade-up relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-plaque bg-primary flex items-center justify-center shadow-plaque mb-4">
            <span className="font-display text-accent-soft text-2xl font-semibold">🏢</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Madonna Community</h1>
        
        </div>

        <form onSubmit={handleSubmit} className="estate-card p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-soft mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-soft mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-xs text-ink-soft hover:text-accent">
              Forgot password?
            </Link>
          </div>

          {error ? (
            <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p>
          ) : null}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <LogIn size={16} />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          Accounts are created by Madonna landlady or chairperson.
          <br />
          Trouble signing in? Speak to caretaker or chairperson.
        </p>
      </div>
    </div>
  )
}
