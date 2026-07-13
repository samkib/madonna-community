import { useEffect, useState } from 'react'
import { Lightbulb, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import UnitPlaque from '../components/UnitPlaque'

export default function Suggestions() {
  const { user, unit, isStaff } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')

  async function load() {
    setLoading(true)
    let query = supabase.from('suggestions').select(
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
    const { error } = await supabase.from('suggestions').insert({
      profile_id: user.id,
      unit_id: unit.id,
      title,
      message,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('')
    setModalOpen(false)
    load()
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-soft max-w-sm">
          Ideas to make the estate better — shared with the management.
        </p>
        {!isStaff ? (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New suggestion
          </button>
        ) : null}
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No suggestions yet." />
      ) : (
        <div className="grid gap-3">
          {items.map((s) => (
            <div key={s.id} className="estate-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isStaff ? <UnitPlaque unitNumber={s.units?.unit_number} size="sm" /> : null}
              </div>
              <p className="text-sm text-ink mt-1.5">{s.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
                {isStaff ? <span>{s.profiles?.full_name}</span> : null}
                <span>{new Date(s.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New suggestion">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Title</label>
            <input
              required
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Suggestion title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Your suggestion</label>
            <textarea
              required
              rows={4}
              className="input-field resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share an idea for the estate…"
            />
          </div>
          {error ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit suggestion'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
