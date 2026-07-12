import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  Pin,
  Wrench,
  MessageSquareWarning,
  Lightbulb,
  Building2,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UnitPlaque from './UnitPlaque'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/notice-board', label: 'Notice Board', icon: Pin, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/suggestions', label: 'Suggestions', icon: Lightbulb, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
  { to: '/units', label: 'Units & Residents', icon: Building2, roles: ['chairperson', 'landlady'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['resident', 'caretaker', 'chairperson', 'landlady'] },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, role, unit } = useAuth()
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-0 h-screen w-72 shrink-0 glass-panel lg:bg-surface lg:backdrop-blur-none flex flex-col transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-line`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-plaque bg-primary flex items-center justify-center shadow-plaque">
              <span className="font-display text-accent-soft text-lg font-semibold">M</span>
            </div>
            <div>
              <p className="font-display text-base leading-none text-ink">Madonna</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft mt-1">Community</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-plaque text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-accent-soft shadow-plaque'
                    : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-alt border border-line flex items-center justify-center font-display text-sm text-ink-soft shrink-0">
              {(user?.name || 'R').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
              <p className="text-[11px] text-ink-soft capitalize">{role}</p>
            </div>
          </div>
          {unit ? (
            <div className="mt-3">
              <UnitPlaque unitNumber={unit.unit_number} size="sm" />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
