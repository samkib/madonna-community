import { useEffect, useState } from 'react'
import { Wrench, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import StatusBadge, { CategoryBadge } from '../components/StatusBadge'
import UnitPlaque from '../components/UnitPlaque'

const CATEGORIES = ['Repainting', 'Electrical', 'Plumbing', 'Repairs', 'Cleaning', 'Security', 'Other']
const STATUSES = ['Pending', 'In Progress', 'Solved']

export default function MaintenanceRequests() {
  const { user, unit, isStaff } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ category: CATEGORIES[0], description: '' })
  const [filter, setFilter] = useState('All')

  async function load() {
    setLoading(true)
    let query = supabase.from('maintenance_requests').select(
      isStaff ? '*, profiles:profile_id(full_name), units:unit_id(unit_number)' : '*'
    )
    query = isStaff
      ? query.order('created_at', { ascending: false })
      : query.eq('profile_id', user.id).order('created_at', { ascending: false })
    const { data, error } = await query
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isStaff])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!unit) {
      setError('You are not assigned to a unit yet. Contact your chairperson.')
      return
    }
    setSubmitting(true)

    if (!form.description.trim()) {
      setError('Please describe the issue.')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('maintenance_requests').insert({
      profile_id: user.id,
      unit_id: unit.id,
      category: form.category,
      description: form.description,
      status: 'Pending',
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setForm({ category: CATEGORIES[0], description: '' })
    setModalOpen(false)
    load()
  }



  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } else {
      setError(error.message)
    }
  }


  const visibleItems = isStaff && filter !== 'All' ? items.filter((r) => r.status === filter) : items

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {isStaff ? (
          <div className="flex gap-2 flex-wrap">
            {['All', ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-plaque text-xs font-medium border transition-colors ${
                  filter === s ? 'bg-primary text-accent-soft border-primary' : 'border-line text-ink-soft hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft max-w-sm">Report a maintenance issue in your unit.</p>
        )}
        {!isStaff ? (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New request
          </button>
        ) : null}
      </div>

      {loading ? (
        <Loader />
      ) : visibleItems.length === 0 ? (
        <EmptyState icon={Wrench} title="No maintenance requests yet." />
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((r) => (
            <div key={r.id} className="estate-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CategoryBadge category={r.category} />
                  {isStaff ? <UnitPlaque unitNumber={r.units?.unit_number} size="sm" /> : null}
                </div>
                <p className="text-sm text-ink mt-1.5">{r.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
                  {isStaff ? <span>{r.profiles?.full_name}</span> : null}
                  <span>{new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              {isStaff ? (
                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                  className="input-field !w-auto text-sm shrink-0"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={r.status} />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New maintenance request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Description</label>
            <textarea
              required
              rows={4}
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue…"
            />
          </div>
          {error ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
