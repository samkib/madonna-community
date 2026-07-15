import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'

export default function Conversations() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')

  async function loadConversations() {
    setLoading(true)

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profiles:resident_id (
          full_name
        ),
        units (
          unit_number
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    }

    setConversations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const filtered = conversations.filter((conversation) => {
    const resident =
      conversation.profiles?.full_name?.toLowerCase() || ''

    const unit =
      conversation.units?.unit_number?.toLowerCase() || ''

    return (
      resident.includes(search.toLowerCase()) ||
      unit.includes(search.toLowerCase())
    )
  })

  if (loading) return <Loader />

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">
        Discussions
      </h1>

      <input
        className="input-field"
        placeholder="Search by resident or unit..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((conversation) => (
        <div
          key={conversation.id}
          className="estate-card p-5"
        >
          <p className="font-medium">
            {conversation.profiles?.full_name}
          </p>

          <p className="text-ink-soft">
            Unit: {conversation.units?.unit_number}
          </p>

          <button
            className="btn-primary mt-4"
            onClick={() => {
              console.log(conversation.id)
              window.location.href = `/messages/${conversation.id}`
            }}
          >
            Open conversation
          </button>
        </div>
      ))}
    </div>
  )
}
