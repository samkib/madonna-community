import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'

export default function Conversations() {

  const navigate = useNavigate()

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
      ),
      messages (
        id,
        message,
        message_type,
        created_at,
        is_read
      )
    `)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const formatted = (data || [])
      .map((conversation) => {
        const latestMessage = [...(conversation.messages || [])]
          .sort(
            (a, b) =>
              new Date(b.created_at) -
              new Date(a.created_at)
          )[0]

        const unreadCount =
          conversation.messages?.filter(
            (m) => !m.is_read
          ).length || 0

        return {
          ...conversation,
          latestMessage,
          unreadCount,
        }
      })
      .sort(
        (a, b) =>
          new Date(
            b.latestMessage?.created_at ||
            b.created_at
          ) -
          new Date(
            a.latestMessage?.created_at ||
            a.created_at
          )
      )

    setConversations(formatted)
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
          <div className="flex justify-between items-center">

            <div>
              <p className="font-medium">
                {conversation.profiles?.full_name}
              </p>

              <p className="text-ink-soft">
                Unit: {conversation.units?.unit_number}
              </p>
            </div>

            {conversation.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {conversation.unreadCount}
              </span>
            )}

          </div>

          {conversation.latestMessage && (
            <div className="mt-3">

              <p className="text-sm text-gray-500">

                {conversation.latestMessage.message_type === 'payment'
                  ? `💰 KES ${conversation.latestMessage.amount || ''}`
                  : conversation.latestMessage.message}

              </p>

            </div>
          )}

          <button
            className="btn-primary mt-4"
            onClick={() =>
              navigate(`/messages/${conversation.id}`)
            }
          >
            Open conversation
          </button>

        </div>
      ))}
    </div>
  )
}
