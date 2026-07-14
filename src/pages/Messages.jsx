import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'

export default function Messages() {
  const { conversationId } = useParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  async function loadMessages() {
    setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (
          full_name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
    }

    setMessages(data || [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message: newMessage,
      })

    if (error) {
      alert(error.message)
      return
    }

    setNewMessage('')
    loadMessages()
  }

  useEffect(() => {
    async function markAsRead() {
      if (!conversationId) return

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
    }

    loadMessages()
    markAsRead()
  }, [conversationId])


  if (loading) return <Loader />

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">
        Conversation
      </h1>

      <div className="estate-card p-5 space-y-4">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b pb-3">
              <p className="font-medium">
                {msg.profiles?.full_name}
              </p>

              <p className="text-sm text-ink-soft">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="estate-card p-5 space-y-3">
        <textarea
          className="input-field min-h-32"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button
          onClick={sendMessage}
          className="btn-primary"
        >
          Send
        </button>
      </div>
    </div>
  )
}

