import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, Mail, Phone, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import UnitPlaque from '../components/UnitPlaque'

export default function Settings() {
  const { user, role, unit, signOut } = useAuth()
  const { isDark, setTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-up">
      <div className="estate-card p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary text-accent-soft flex items-center justify-center font-display text-3xl mb-4 shadow-plaque">
          {(user?.name || 'R').charAt(0).toUpperCase()}
        </div>
        <h2 className="font-display text-xl text-ink">{user?.name}</h2>
        <p className="text-sm text-ink-soft capitalize mt-1">{role}</p>
        {unit ? (
          <div className="mt-3">
            <UnitPlaque unitNumber={unit.unit_number} />
          </div>
        ) : null}
      </div>

      <div className="estate-card">
        <div className="estate-card-header">
          <h3 className="font-display text-base text-ink">Account details</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-ink-soft shrink-0" />
            <div>
              <p className="text-xs text-ink-soft">Email</p>
              <p className="text-sm text-ink">{user?.email}</p>
            </div>
          </div>
          {user?.phone ? (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-ink-soft shrink-0" />
              <div>
                <p className="text-xs text-ink-soft">Phone</p>
                <p className="text-sm text-ink">{user.phone}</p>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-ink-soft shrink-0" />
            <div>
              <p className="text-xs text-ink-soft">Role</p>
              <p className="text-sm text-ink capitalize">{role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="estate-card">
        <div className="estate-card-header">
          <h3 className="font-display text-base text-ink">Appearance</h3>
        </div>
        <div className="p-5 flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-plaque border transition-colors ${
              !isDark ? 'border-accent bg-surface-alt' : 'border-line text-ink-soft'
            }`}
          >
            <Sun size={18} />
            <span className="text-sm">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-plaque border transition-colors ${
              isDark ? 'border-accent bg-surface-alt' : 'border-line text-ink-soft'
            }`}
          >
            <Moon size={18} />
            <span className="text-sm">Dark</span>
          </button>
        </div>
      </div>

      <button onClick={handleSignOut} className="btn-secondary w-full !text-urgent !border-urgent/30 hover:!bg-urgent/10">
        <LogOut size={16} /> Sign out
      </button>
    </div>
  )
}
