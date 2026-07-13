import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../context/ThemeContext'
import Loader from '../components/Loader'

export default function ResetPassword() {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) {
        setReady(true)
      } else {
        setLinkInvalid(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setLinkInvalid(false)
      }
    })

    return () => {
      active = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/'), 2000)
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
          <div className="w-14 h-14 rounded-plaque overflow-hidden shadow-plaque mb-4">
            <img
              src="/logo.png"
              alt="Madonna Community"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-display text-2xl text-ink">Set a new password</h1>
        </div>

        <div className="estate-card p-6">
          {!ready && !linkInvalid ? (
            <Loader label="Verifying your link…" />
          ) : linkInvalid ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-ink">This reset link is invalid or has expired.</p>
              <a href="/forgot-password" className="btn-primary w-full inline-flex mt-2">
                Request a new link
              </a>
            </div>
          ) : done ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-ink">Password updated. Taking you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-soft mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="At least 6 characters"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-ink-soft mb-1.5"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Re-enter password"
                />
              </div>

              {error ? (
                <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p>
              ) : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                <KeyRound size={16} />
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

