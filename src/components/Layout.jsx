import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/announcements': 'Announcements',
  '/notice-board': 'Notice Board',
  '/maintenance': 'Maintenance Requests',
  '/complaints': 'Complaints',
  '/suggestions': 'Suggestions',
  '/units': 'Units & Residents',
  '/settings': 'Settings',
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Madonna Community'

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopBar title={title} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
