import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../context/ThemeContext'

export default function ForgotPassword() {
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
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
          <h1 className="font-display text-2xl text-ink">Reset your password</h1>
          <p className="text-sm text-ink-soft mt-1 text-center">
            Enter your email and we'll send you a link to set a new password.
          </p>
        </div>

        <div className="estate-card p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-plaque bg-solved/15 text-solved flex items-center justify-center mx-auto">
                <Mail size={20} />
              </div>
              <p className="text-sm text-ink">
                If an account exists for <span className="font-medium">{email}</span>, a reset link
                is on its way.
              </p>
              <p className="text-xs text-ink-soft">
                Check your inbox (and spam folder). The link expires after a while, so use it soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error ? (
                <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p>
              ) : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                <Mail size={16} />
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-ink mt-6"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  )
}

