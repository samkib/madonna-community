import { useEffect, useState } from 'react'
import { Pin } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

export default function NoticeBoard() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notice_board')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function deleteNotice(id) {
    await supabase
      .from('notice_board')
      .delete()
      .eq('id', id)

    load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-sm text-ink-soft max-w-md">
        Archived announcements and standing notices for the estate.
      </p>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Pin} title="Notice board is empty." hint="Archived announcements will appear here." />
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {items.map((n) => (
            <div key={n.id} className="estate-card p-5 break-inside-avoid relative">
              <Pin size={14} className="absolute -top-2 left-5 text-accent rotate-12" />
              <button
                onClick={() => deleteNotice(n.id)}
                className="btn-ghost absolute top-4 right-4 text-xs"
                title="Remove notice"
              >
                Delete
              </button>
              <h3 className="font-display text-base text-ink mb-1.5">{n.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{n.message}</p>
              <p className="text-xs text-ink-soft/70 mt-3">
                {new Date(n.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
