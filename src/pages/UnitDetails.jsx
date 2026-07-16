import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'

export default function UnitDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isStaff } = useAuth()

  const [loading, setLoading] = useState(true)

  const [unit, setUnit] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [complaints, setComplaints] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [payments, setPayments] = useState([])



  useEffect(() => {
    if (!isStaff) {
      navigate('/dashboard')
      return
    }

    async function loadUnitData() {
      setLoading(true)

      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          *,
          profiles:resident_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (unitError) {
        console.error('Failed to load unit:', unitError)
        // Helpful for debugging in console
        console.error('unitError.message:', unitError.message)
        console.error('unitError.details:', unitError.details)
        console.error('unitError.hint:', unitError.hint)
        setLoading(false)
        return
      }

      setUnit(unitData)

      const { data: conversationData, error: conversationError } =
        await supabase
          .from('conversations')
          .select('id')
          .eq('unit_id', id)
          .maybeSingle()

      if (conversationError) {
        console.error('Failed to load conversation:', conversationError)
      } else {
        setConversationId(conversationData?.id)
      }

      const [
        { data: paymentsData, error: paymentsError },
        { data: maintenanceData, error: maintenanceError },
        { data: complaintsData, error: complaintsError },
        { data: suggestionsData, error: suggestionsError },
      ] = await Promise.all([
        supabase
          .from('payments')
          .select('id, month, year, rent_amount, amount_paid, balance, status')
          .eq('unit_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('maintenance_requests')
          .select('id, category, description, status')
          .eq('unit_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('complaints')
          .select('id, subject')
          .eq('unit_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('suggestions')
          .select('id, message')
          .eq('unit_id', id)
          .order('created_at', { ascending: false }),
      ])

      if (paymentsError) {
        console.error('Failed to load payments:', paymentsError)
      } else {
        setPayments(paymentsData || [])
      }

      if (maintenanceError) {
        console.error('Failed to load maintenance requests:', maintenanceError)
      } else {
        setMaintenance(maintenanceData || [])
      }

      if (complaintsError) {
        console.error('Failed to load complaints:', complaintsError)
      } else {
        setComplaints(complaintsData || [])
      }

      if (suggestionsError) {
        console.error('Failed to load suggestions:', suggestionsError)
      } else {
        setSuggestions(suggestionsData || [])
      }


      setLoading(false)
    }

    loadUnitData()
  }, [id, isStaff, navigate])


  if (loading) return <Loader />

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">
        Unit {unit?.unit_number}
      </h1>

      <div className="estate-card p-5">
        <h2 className="font-semibold mb-3">
          Resident details
        </h2>

        {unit?.profiles ? (
          <>
            <p>Name: {unit.profiles.full_name}</p>
            <p>Email: {unit.profiles.email}</p>
            <p>Phone: {unit.profiles.phone || 'No phone number'}</p>

            {conversationId && (
              <button
                onClick={() => navigate(`/messages/${conversationId}`)}
                className="btn-primary mt-4"
              >
                View conversation
              </button>
            )}
          </>
        ) : (
          <p>This unit is vacant.</p>
        )}
      </div>


      <div className="estate-card p-5 mt-6">
        <h2 className="font-semibold mb-3">Payment history</h2>

        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="mb-3 border-b pb-2">
              <p>
                {payment.month}/{payment.year}
              </p>

              <p className="text-sm text-ink-soft">
                Rent: KES {payment.rent_amount}
              </p>

              <p className="text-sm text-ink-soft">
                Paid: KES {payment.amount_paid}
              </p>

              <p className="text-sm text-ink-soft">
                Balance: KES {payment.balance}
              </p>

              <p className="text-xs">Status: {payment.status}</p>
            </div>
          ))
        )}
      </div>

      <div className="estate-card p-5 mt-6">
        <h2 className="font-semibold mb-3">Maintenance requests</h2>


        {maintenance.length === 0 ? (
          <p>No maintenance requests.</p>
        ) : (
          maintenance.map((item) => (
            <div key={item.id} className="mb-3 border-b pb-2">
              <p>{item.category}</p>
              <p className="text-sm text-ink-soft">{item.description}</p>
              <p className="text-xs">Status: {item.status}</p>
            </div>
          ))
        )}
      </div>

      <div className="estate-card p-5 mt-6">
        <h2 className="font-semibold mb-3">Complaints</h2>

        {complaints.length === 0 ? (
          <p>No complaints.</p>
        ) : (
          complaints.map((item) => (
            <div key={item.id} className="mb-3 border-b pb-2">
              <p>{item.subject}</p>
            </div>
          ))
        )}
      </div>

      <div className="estate-card p-5 mt-6">
        <h2 className="font-semibold mb-3">Suggestions</h2>

        {suggestions.length === 0 ? (
          <p>No suggestions.</p>
        ) : (
          suggestions.map((item) => (
            <div key={item.id} className="mb-3 border-b pb-2">
              <p>{item.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}