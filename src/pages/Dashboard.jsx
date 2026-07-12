import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  MessageSquareWarning,
  Lightbulb,
  Megaphone,
  Building2,
  Home,
  ArrowUpRight,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import StatusBadge, { UrgentBadge } from '../components/StatusBadge'

function StatCard({ icon: Icon, label, value, to, tone = 'primary' }) {
  return (
    <Link
      to={to}
      className="estate-card p-5 flex items-start justify-between group hover:-translate-y-0.5 transition-transform duration-200"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">{label}</p>
        <p className="font-display text-3xl text-ink">{value}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-plaque flex items-center justify-center shrink-0 ${
          tone === 'primary' ? 'bg-primary text-accent-soft' : 'bg-surface-alt text-ink-soft'
        }`}
      >
        <Icon size={18} />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user, role, isStaff, unit } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [myRequests, setMyRequests] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)

      const { data: recentAnnouncements, error: announcementsError } =
        await supabase
          .from('announcements')
          .select('*')
          .eq('archived', false)
          .order('created_at', { ascending: false })
          .limit(3)

      if (!active) return
      setAnnouncements(recentAnnouncements || [])

      if (isStaff) {
        const [
          pendingMaintenance,
          pendingComplaints,
          totalSuggestions,
          unitsData
        ] = await Promise.all([
          supabase
            .from('maintenance_requests')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('suggestions')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('units')
            .select('status'),
        ])

        const occupied = (unitsData.data || []).filter(
          (u) => u.status === 'occupied'
        ).length

        const vacant = (unitsData.data || []).filter(
          (u) => u.status === 'vacant'
        ).length

        if (!active) return
        setStats({
          pendingMaintenance: pendingMaintenance.count ?? 0,
          pendingComplaints: pendingComplaints.count ?? 0,
          totalSuggestions: totalSuggestions.count ?? 0,
          occupied,
          vacant,
        })
      }

      if (active) setLoading(false)
    }
    if (user) load()
    return () => {
      active = false
    }
  }, [user, isStaff])

  if (loading) return <Loader label="Loading your dashboard…" />

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-ink-soft text-sm">Welcome back,</p>
        <h2 className="font-display text-2xl sm:text-3xl text-ink">{user?.name}</h2>
      </div>

      {isStaff ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wrench} label="Pending maintenance" value={stats.pendingMaintenance} to="/maintenance" />
          <StatCard icon={MessageSquareWarning} label="Pending complaints" value={stats.pendingComplaints} to="/complaints" />
          <StatCard icon={Lightbulb} label="Suggestions" value={stats.totalSuggestions} to="/suggestions" />
          <StatCard icon={Building2} label="Occupied / Vacant" value={`${stats.occupied} / ${stats.vacant}`} to="/units" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="estate-card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-plaque bg-primary text-accent-soft flex items-center justify-center shrink-0">
              <Home size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-soft">Your unit</p>
              <p className="font-display text-xl text-ink">{unit?.unit_number || 'Not yet assigned'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/maintenance" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform">
              <Wrench size={18} className="text-primary" />
              <span className="text-xs font-medium text-ink-soft">Maintenance</span>
            </Link>
            <Link to="/complaints" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform">
              <MessageSquareWarning size={18} className="text-primary" />
              <span className="text-xs font-medium text-ink-soft">Complaint</span>
            </Link>
            <Link to="/suggestions" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform">
              <Lightbulb size={18} className="text-primary" />
              <span className="text-xs font-medium text-ink-soft">Suggest</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="estate-card">
          <div className="estate-card-header">
            <h3 className="font-display text-lg text-ink flex items-center gap-2">
              <Megaphone size={17} className="text-accent" /> Latest announcements
            </h3>
            <Link to="/announcements" className="text-xs text-ink-soft hover:text-accent flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {announcements.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements available." />
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="pb-4 border-b border-line last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-ink text-sm">{a.title}</p>
                    {a.is_urgent ? <UrgentBadge /> : null}
                  </div>
                  <p className="text-sm text-ink-soft line-clamp-2">{a.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {!isStaff ? (
          <div className="estate-card">
            <div className="estate-card-header">
              <h3 className="font-display text-lg text-ink flex items-center gap-2">
                <Wrench size={17} className="text-accent" /> Your recent requests
              </h3>
              <Link to="/maintenance" className="text-xs text-ink-soft hover:text-accent flex items-center gap-1">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {myRequests.length === 0 ? (
                <EmptyState icon={Wrench} title="No maintenance requests yet." />
              ) : (
                myRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between pb-4 border-b border-line last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-ink text-sm">{r.category}</p>
                      <p className="text-xs text-ink-soft line-clamp-1">{r.description}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="estate-card p-5">
            <h3 className="font-display text-lg text-ink mb-3">Signed in as</h3>
            <p className="text-sm text-ink-soft capitalize">
              {role} · {user?.email}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
