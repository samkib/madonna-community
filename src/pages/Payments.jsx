import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'

export default function Payments() {


  const { user, isStaff } = useAuth()

  const [editingPayment, setEditingPayment] = useState(null)


  const [searchUnit, setSearchUnit] = useState('')

  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [amountPaid, setAmountPaid] = useState('')
  const [mpesaMessage, setMpesaMessage] = useState('')

  // editingPayment removed: residents don't edit individual payments in this flow







  const [payments, setPayments] = useState([])
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
      .order('submitted_at', {
        ascending: false,
        nullsFirst: false,
      })


    if (!isStaff) {
      query = query.eq('resident_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      setPayments([])
    } else {
      setPayments(data || [])
    }

    setLoading(false)

  }


  useEffect(() => {
    if (user) {
      loadPayments()
    }
  }, [user, isStaff])


  async function createNotification(
    recipientId,
    title,
    body,
    type,
    referenceId = null
  ) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        title,
        body,
        type,
        reference_id: referenceId,
      })

    if (error) {
      console.error(error)
    }
  }

  async function submitPayment(payment) {

    if (!amountPaid || !mpesaMessage.trim()) {
      alert('Please enter the amount and M-Pesa message.')
      return
    }

    try {
      // Save payment details
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          amount_paid: Number(amountPaid),
          mpesa_statement: mpesaMessage,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (paymentError) {
        throw paymentError
      }

      await loadPayments()

      setEditingPayment(null)
      setAmountPaid('')
      setMpesaMessage('')

      const { data: staffMembers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['landlady', 'chairperson', 'caretaker'])

      for (const member of staffMembers || []) {
        await createNotification(
          member.id,
          'Payment submitted',
          `${user.fullName} submitted KES ${amountPaid}.`,
          'payment_received',
          payment.id
        )
      }
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

    const payment = payments.find((p) => p.id === paymentId)

    if (payment) {
      await createNotification(
        payment.resident_id,
        'Payment approved',
        `Your payment for ${payment.month}/${payment.year} has been approved.`,
        'payment_approved',
        payment.id
      )
    }

    await loadPayments()
    setEditingPayment(null)
    setAmountPaid('')
    setMpesaMessage('')
  }

  async function updateStatus(paymentId, newStatus) {
    if (newStatus === 'paid') {
      return approvePayment(paymentId)
    }

    const payment = payments.find((p) => p.id === paymentId)

    const { error } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        verified_by: newStatus === 'pending' ? null : user.id,
        verified_at:
          newStatus === 'pending'
            ? null
            : new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    if (newStatus === 'rejected' && payment) {
      await createNotification(
        payment.resident_id,
        'Payment rejected',
        `Your payment for ${payment.month}/${payment.year} was rejected.`,
        'payment_rejected',
        payment.id
      )
    }

    await loadPayments()
  }



  if (loading) return <Loader />

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Payments</h1>

        <div className="flex gap-3 flex-wrap">
          <input
            className="input-field"
            placeholder="Month/Year e.g. 7/2026"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {isStaff && (
            <input
              className="input-field"
              placeholder="Search unit"
              value={searchUnit}
              onChange={(e) => setSearchUnit(e.target.value)}
            />
          )}
        </div>
      </div>



      {payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        payments
          .filter((payment) => {
            const unitMatch =
              !searchUnit ||
              payment.units?.unit_number
                ?.toLowerCase()
                .includes(searchUnit.toLowerCase())

            const monthMatch =
              !monthFilter ||
              `${payment.month}/${payment.year}`.trim() === monthFilter.trim()

            const statusMatch =
              statusFilter === 'all' || payment.status === statusFilter

            return unitMatch && monthMatch && statusMatch
          })

          .map((payment) => (
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

            {payment.mpesa_statement && (
              <div className="mt-4 p-3 rounded-lg bg-surface-alt">
                <p className="font-medium mb-2">M-Pesa message</p>

                <p className="text-sm whitespace-pre-wrap">
                  {payment.mpesa_statement}
                </p>
              </div>
            )}

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

            {!isStaff && payment.status !== 'paid' && (
              <div className="mt-4 space-y-3">
                {editingPayment !== payment.id ? (
                  <button
                    onClick={() => {
                      setEditingPayment(payment.id)
                      setAmountPaid(payment.amount_paid || '')
                      setMpesaMessage(payment.mpesa_statement || '')
                    }}
                    className="btn-primary w-full"
                  >
                    Pay rent
                  </button>
                ) : (
                  <>
                    <input
                      type="number"
                      placeholder="Amount paid"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="input-field"
                    />

                    <textarea
                      placeholder="Paste M-Pesa message..."
                      value={mpesaMessage}
                      onChange={(e) => setMpesaMessage(e.target.value)}
                      className="input-field min-h-32"
                    />

                    <button
                      onClick={() => submitPayment(payment)}
                      className="btn-primary w-full"
                    >
                      Submit payment
                    </button>

                    <button
                      onClick={() => {
                        setEditingPayment(null)
                        setAmountPaid('')
                        setMpesaMessage('')
                      }}
                      className="btn-secondary w-full"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}

            {isStaff && (
              <div className="mt-4 flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => approvePayment(payment.id)}
                  className="btn-primary"
                >
                  Mark as paid
                </button>

                <select
                  value={payment.status}
                  onChange={(e) => updateStatus(payment.id, e.target.value)}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}

          </div>
        ))
      )}


    </div>
  )
}