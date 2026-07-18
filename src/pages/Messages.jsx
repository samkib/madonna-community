import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'

export default function Messages() {
  const { conversationId } = useParams()
  const { user, role } = useAuth()

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [tab, setTab] = useState('all')

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
        message_type: 'chat',
      })

    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        resident_id
      `)
      .eq('id', conversationId)
      .single()

    let recipients = []

    if (role === 'resident') {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['landlady', 'caretaker', 'chairperson'])

      recipients = data || []
    } else {
      recipients = [
        {
          id: conversation.resident_id,
        },
      ]
    }

    if (recipients.length > 0) {
      await supabase
        .from('notifications')
        .insert(
          recipients.map((person) => ({
            recipient_id: person.id,
            title: 'New message',
            body: newMessage,
            type: 'new_message',
            reference_id: conversationId,
          }))
        )
    }

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
        .neq('sender_id', user.id)
    }

    loadMessages()
    markAsRead()

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages()
          markAsRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, user.id])


  if (loading) return <Loader />

  const filteredMessages = messages.filter((msg) => {
    if (tab === 'all') return true

    return msg.message_type === tab
  })

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">
        Conversation
      </h1>

      <div className="flex gap-2">
        <button
          className={`btn-secondary ${
            tab === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setTab('all')}
        >
          All
        </button>

        <button
          className={`btn-secondary ${
            tab === 'chat' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setTab('chat')}
        >
          Chats
        </button>

        <button
          className={`btn-secondary ${
            tab === 'payment' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setTab('payment')}
        >
          Payments
        </button>
      </div>

      <div className="estate-card p-5 space-y-4">
        {filteredMessages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="border-b pb-4"
            >
              <p className="font-medium">
                {msg.profiles?.full_name}
              </p>

              {msg.message_type === 'payment' ? (
                <div className="mt-2 rounded-xl bg-green-50 border border-green-200 p-4">
                  <p className="font-semibold text-green-700">
                    💰 Payment Submitted
                  </p>

                  <p className="text-sm mt-2">
                    Amount: KES {msg.amount}
                  </p>

                  {msg.transaction_code && (
                    <p className="text-sm">
                      Transaction: {msg.transaction_code}
                    </p>
                  )}

                  <div className="mt-3 rounded-lg bg-white p-3 text-sm whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-soft mt-2 whitespace-pre-wrap">
                  {msg.message}
                </p>
              )}
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

