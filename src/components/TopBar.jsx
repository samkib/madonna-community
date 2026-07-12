import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function TopBar({ title, onMenuClick }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 glass-panel lg:bg-bg/80 lg:backdrop-blur-xl border-b border-line px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2 -ml-2" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="font-display text-xl sm:text-2xl text-ink">{title}</h1>
      </div>
      <button
        onClick={toggleTheme}
        className="btn-secondary !px-3 !py-2"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        <span className="hidden sm:inline text-sm">{isDark ? 'Light' : 'Dark'}</span>
      </button>
    </header>
  )
}
