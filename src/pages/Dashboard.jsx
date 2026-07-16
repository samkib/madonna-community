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
import estateBuilding from '../assets/ground.jpeg'

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
  const [generatedPayments, setGeneratedPayments] = useState([])
  const [generateMonth, setGenerateMonth] = useState('')
  const [generateYear, setGenerateYear] = useState('')

  async function generateRecords() {
    if (!generateMonth || !generateYear) {
      alert('Enter month and year')
      return
    }

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select(`
        id,
        resident_id,
        rent_amount
      `)
      .eq('status', 'occupied')

    if (unitsError) {
      alert(unitsError.message)
      return
    }

    const records = []

    for (const unit of units) {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('unit_id', unit.id)
        .eq('month', generateMonth)
        .eq('year', generateYear)
        .maybeSingle()

      if (existing) {
        continue
      }

      records.push({
        unit_id: unit.id,
        resident_id: unit.resident_id,
        month: Number(generateMonth),
        year: Number(generateYear),
        rent_amount: unit.rent_amount,
        amount_paid: 0,
        balance: unit.rent_amount,
        status: 'pending'
      })
    }

    if (records.length === 0) {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          units(unit_number),
          profiles:resident_id(full_name)
        `)
        .eq('month', generateMonth)
        .eq('year', generateYear)

      setGeneratedPayments(data || [])

      alert('All payment records already exist.')
      return
    }

    const { error } = await supabase
      .from('payments')
      .insert(records)

    if (error) {
      alert(error.message)
      return
    }

    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        units(unit_number),
        profiles:resident_id(full_name)
      `)
      .eq('month', generateMonth)
      .eq('year', generateYear)

    setGeneratedPayments(data || [])

    alert(`${records.length} payment records generated successfully.`)
  }

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
          unitsData,
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
      } else {
        const { data: requests } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
        if (!active) return
        setMyRequests(requests || [])
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
    <div className="relative rounded-plaque overflow-hidden -m-4 sm:-m-6">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${estateBuilding})` }}
      />
      {/* Dark overlay so text/cards stay readable over the photo */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Actual dashboard content, sits above the photo + overlay */}
      <div className="relative space-y-8 animate-fade-up p-4 sm:p-6">
        <div>
          <p className="text-white/70 text-sm">Welcome back,</p>
          <h2 className="font-display text-2xl sm:text-3xl text-white">{user?.name}</h2>
        </div>

        {isStaff ? (
          <div>
            <div className="estate-card p-5 mb-6 backdrop-blur-sm bg-surface/90">
              <h3 className="font-display text-lg text-ink mb-4">
                Generate rent records
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Generate month"
                  className="input-field"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Generate year"
                  className="input-field"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(e.target.value)}
                />
              </div>

              <button onClick={generateRecords} className="btn-primary mt-4">
                Generate records
              </button>

              {generatedPayments.length > 0 && (
                <div className="estate-card p-5 mt-6">
                  <h3 className="font-semibold mb-4">
                    Rent records for {generateMonth}/{generateYear}
                  </h3>

                  {generatedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-b py-3"
                    >
                      <p>Unit: {payment.units?.unit_number}</p>

                      <p>
                        Resident: {payment.profiles?.full_name}
                      </p>

                      <p>
                        Rent: KES {payment.rent_amount}
                      </p>

                      <p>
                        Paid: KES {payment.amount_paid}
                      </p>

                      <p>
                        Balance: KES {payment.balance}
                      </p>

                      <p>
                        Status: {payment.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Wrench}
                label="Pending maintenance"
                value={stats.pendingMaintenance}
                to="/maintenance/request"
              />
              <StatCard icon={MessageSquareWarning} label="Pending complaints" value={stats.pendingComplaints} to="/complaints" />
              <StatCard icon={Lightbulb} label="Suggestions" value={stats.totalSuggestions} to="/suggestions" />
              <StatCard icon={Building2} label="Occupied / Vacant" value={`${stats.occupied} / ${stats.vacant}`} to="/units" />
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="estate-card p-5 flex items-center gap-4 backdrop-blur-sm bg-surface/90">
              <div className="w-11 h-11 rounded-plaque bg-primary text-accent-soft flex items-center justify-center shrink-0">
                <Home size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">Your unit</p>
                <p className="font-display text-xl text-ink">{unit?.unit_number || 'Not yet assigned'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/maintenance/request" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform backdrop-blur-sm bg-surface/90">
                <Wrench size={18} className="text-primary" />
                <span className="text-xs font-medium text-ink-soft">Maintenance</span>
              </Link>
              <Link to="/complaints" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform backdrop-blur-sm bg-surface/90">
                <MessageSquareWarning size={18} className="text-primary" />
                <span className="text-xs font-medium text-ink-soft">Complaint</span>
              </Link>
              <Link to="/suggestions" className="estate-card p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-transform backdrop-blur-sm bg-surface/90">
                <Lightbulb size={18} className="text-primary" />
                <span className="text-xs font-medium text-ink-soft">Suggest</span>
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="estate-card backdrop-blur-sm bg-surface/90">
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
            <div className="estate-card backdrop-blur-sm bg-surface/90">
              <div className="estate-card-header">
                <h3 className="font-display text-lg text-ink flex items-center gap-2">
                  <Wrench size={17} className="text-accent" /> Your recent requests
                </h3>
                <Link to="/maintenance/request" className="text-xs text-ink-soft hover:text-accent flex items-center gap-1">
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
            <div className="estate-card p-5 backdrop-blur-sm bg-surface/90">
              <h3 className="font-display text-lg text-ink mb-3">Signed in as</h3>
              <p className="text-sm text-ink-soft capitalize">
                {role} · {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

