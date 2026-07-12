import { useEffect, useState } from 'react'
import { MessageSquareWarning, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import UnitPlaque from '../components/UnitPlaque'

const STATUSES = ['Pending', 'In Progress', 'Solved']

export default function Complaints() {
  const { user, unit, isStaff } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState('')
  const [filter, setFilter] = useState('All')

  async function load() {
    setLoading(true)
    let query = supabase.from('complaints').select(
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
    const { error } = await supabase.from('complaints').insert({
      profile_id: user.id,
      unit_id: unit.id,
      subject,
      status: 'Pending',
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSubject('')
    setModalOpen(false)
    load()
  }

  async function updateStatus(id, status) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    await supabase.from('complaints').update({ status }).eq('id', id)
  }

  const visibleItems = isStaff && filter !== 'All' ? items.filter((c) => c.status === filter) : items

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
          <p className="text-sm text-ink-soft max-w-sm">Raise a complaint for the caretaker and management to address.</p>
        )}
        {!isStaff ? (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New complaint
          </button>
        ) : null}
      </div>

      {loading ? (
        <Loader />
      ) : visibleItems.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No complaints submitted." />
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((c) => (
            <div key={c.id} className="estate-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isStaff ? <UnitPlaque unitNumber={c.units?.unit_number} size="sm" /> : null}
                </div>
                <p className="text-sm text-ink mt-1.5">{c.subject}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
                  {isStaff ? <span>{c.profiles?.full_name}</span> : null}
                  <span>{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              {isStaff ? (
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value)}
                  className="input-field !w-auto text-sm shrink-0"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={c.status} />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Subject</label>
            <textarea
              required
              rows={4}
              className="input-field resize-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describe your complaint…"
            />
          </div>
          {error ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit complaint'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
