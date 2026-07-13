import { useEffect, useState } from 'react'
import { Megaphone, Plus, Archive } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { UrgentBadge, CategoryBadge } from '../components/StatusBadge'

const CATEGORIES = [
  'Meetings',
  'Maintenance Alerts',
  'Reminders',
  'Lost & Found',
  'Community Events',
  'Security / Emergency Notices',
  'Policy & Rule Changes',
  'Motivational / Engagement',
  'Other',
]

export default function Announcements() {
  const { user, isStaff } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', category: CATEGORIES[0], is_urgent: false })
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('archived', false)
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.from('announcements').insert({
      title: form.title,
      message: form.message,
      category: form.category,
      is_urgent: form.is_urgent,
      archived: false,
      created_by: user.id,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setForm({ title: '', message: '', category: CATEGORIES[0], is_urgent: false })
    setModalOpen(false)
    load()
  }

  async function handleArchive(item) {
    const { error: archiveError } = await supabase
      .from('announcements')
      .update({ archived: true })
      .eq('id', item.id)

    if (archiveError) {
      alert(archiveError.message)
      return
    }

    const { error: noticeError } = await supabase
      .from('notice_board')
      .insert({
        title: item.title,
        message: item.message,
        created_at: item.created_at,
      })

    if (noticeError) {
      alert(noticeError.message)
      return
    }

    load()
  }

  async function postToNoticeBoard(announcement) {
    const { error } = await supabase
      .from('notice_board')
      .insert({
        title: announcement.title,
        message: announcement.message,
        category: announcement.category,
      })

    if (error) {
      alert(error.message)
      return
    }

    alert('Added to Notice Board')
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-soft max-w-md">
          Estate-wide notices from the caretaker, chairperson, and landlady.
        </p>
        {isStaff ? (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New announcement
          </button>
        ) : null}
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements available." hint="Check back soon for estate updates." />
      ) : (
        <div className="grid gap-4">
          {items.map((a) => (
            <div key={a.id} className="estate-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg text-ink">{a.title}</h3>
                  {a.is_urgent ? <UrgentBadge /> : null}
                </div>
                {isStaff ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleArchive(a)}
                      className="btn-ghost !px-2.5 !py-1.5 text-xs"
                      title="Archive to notice board"
                    >
                      <Archive size={14} /> Archive
                    </button>
                    <button
                      onClick={() => postToNoticeBoard(a)}
                      className="btn-ghost"
                    >
                      Pin to Notice Board
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">{a.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <CategoryBadge category={a.category} />
                <span className="text-xs text-ink-soft">
                  {new Date(a.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Title</label>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. To All"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Message</label>
            <textarea
              required
              rows={4}
              className="input-field resize-none"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Details residents should know…"
            />
          </div>
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
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.is_urgent}
              onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
              className="rounded border-line accent-accent"
            />
            Mark as urgent
          </label>
          {error ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Posting…' : 'Post announcement'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
