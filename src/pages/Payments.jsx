import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'

export default function Payments() {

  const { user, isStaff } = useAuth()
  const navigate = useNavigate()

  const [editingPayment, setEditingPayment] = useState(null)

  const [amountPaid, setAmountPaid] = useState('')
  const [mpesaMessage, setMpesaMessage] = useState('')

  const [discussionOpen, setDiscussionOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  const [payments, setPayments] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [loading, setLoading] = useState(true)


  async function loadPayments() {
    setLoading(true)

    let query = supabase
      .from('payments')
      .select(`
        *,
        units (
          unit_number
        ),
        profiles:resident_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (!isStaff) {
      query = query.eq('resident_id', user.id)
    }

    const { data } = await query

    setPayments(data || [])

    const counts = {}

    for (const payment of data || []) {
      if (!payment.conversation_id) continue


      const { count } = await supabase
        .from('messages')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('conversation_id', payment.conversation_id)
        .eq('is_read', false)

      counts[payment.id] = count || 0
    }

    setUnreadCounts(counts)
    setLoading(false)
  }


  useEffect(() => {
    if (user) {
      loadPayments()
    }
  }, [user, isStaff])


  async function submitPayment(payment) {
    try {
      let conversationId = payment.conversation_id

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: conversation, error: conversationError } =
          await supabase
            .from('conversations')
            .insert({
              resident_id: user.id,
              unit_id: payment.unit_id,
            })
            .select()
            .single()

        if (conversationError) {
          throw conversationError
        }

        conversationId = conversation.id
      }

      // Save payment details
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          amount_paid: Number(amountPaid),
          mpesa_statement: mpesaMessage,
          status: 'pending',
          conversation_id: conversationId,
        })
        .eq('id', payment.id)

      if (paymentError) {
        throw paymentError
      }

      // Save first message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: mpesaMessage,
        })

      if (messageError) {
        throw messageError
      }

      await loadPayments()
      setEditingPayment(null)
      setAmountPaid('')
      setMpesaMessage('')
    } catch (error) {
      alert(error.message)
    }
  }

  async function approvePayment(paymentId) {
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    await loadPayments()
    setEditingPayment(null)
    setAmountPaid('')
    setMpesaMessage('')
  }


  async function rejectPayment(paymentId) {
    await supabase
      .from('payments')
      .update({
        status: 'rejected',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    await loadPayments()
    setEditingPayment(null)
    setAmountPaid('')
    setMpesaMessage('')
  }


  if (loading) return <Loader />

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">Payments</h1>

      {payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        payments.map((payment) => (
          <div key={payment.id} className="estate-card p-5">
            {isStaff && (
              <p className="font-medium">
                Resident: {payment.profiles?.full_name}
              </p>
            )}

            <p>Unit: {payment.units?.unit_number}</p>

            <p>
              Month: {payment.month}/{payment.year}
            </p>

            <p>Rent: KES {payment.rent_amount}</p>

            <p>Paid: KES {payment.amount_paid}</p>

            <p>Balance: KES {payment.balance}</p>

            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : payment.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-700'
                    : payment.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {payment.status}
              </span>
            </div>

            {!isStaff && (
              <div className="mt-4 space-y-3">
                <input
                  type="number"
                  placeholder="Amount paid"
                  value={editingPayment === payment.id ? amountPaid : ''}
                  onChange={(e) => {
                    setEditingPayment(payment.id)
                    setAmountPaid(e.target.value)
                  }}
                  className="input-field"
                />

                <textarea
                  placeholder="Paste your M-Pesa message here..."
                  value={editingPayment === payment.id ? mpesaMessage : ''}
                  onChange={(e) => {
                    setEditingPayment(payment.id)
                    setMpesaMessage(e.target.value)
                  }}
                  className="input-field min-h-32"
                />

                <button
                  onClick={() => submitPayment(payment)}
                  className="btn-primary w-full"
                >
                  Submit payment
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="relative">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (payment.conversation_id) {
                      navigate(`/messages/${payment.conversation_id}`)
                    }
                  }}
                >
                  View discussion
                </button>

                {unreadCounts[payment.id] > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-1">
                    {unreadCounts[payment.id]}
                  </span>
                )}
              </div>
            </div>



            {isStaff && payment.status === 'pending' && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => approvePayment(payment.id)}
                  className="btn-primary"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectPayment(payment.id)}
                  className="btn-secondary"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {discussionOpen && (
        <div className="estate-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Payment discussion</h2>

            <button
              onClick={() => setDiscussionOpen(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>

          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-4 border-b pb-2">
                <p className="font-medium">{msg.profiles?.full_name}</p>
                <p className="text-sm text-ink-soft">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

