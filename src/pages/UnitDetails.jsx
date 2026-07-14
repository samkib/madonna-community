import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'

export default function UnitDetails() {
  const navigate = useNavigate()
  const { id } = useParams()


  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [complaints, setComplaints] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [payments, setPayments] = useState([])



  useEffect(() => {
    async function loadUnitData() {
      setLoading(true)

      const { data: unitData } = await supabase
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

      setUnit(unitData)

      const { data: conversationData } = await supabase
        .from('conversations')
        .select('id')
        .eq('unit_id', id)
        .maybeSingle()

      setConversationId(conversationData?.id)

      const { data: paymentsData, error: paymentsError } = await supabase

        .from('payments')
        .select('*')
        .eq('unit_id', id)
        .order('created_at', { ascending: false })

      console.log('Payments:', paymentsData)
      console.log('Payments error:', paymentsError)

      setPayments(paymentsData || [])




      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('unit_id', id)
        .order('created_at', { ascending: false })

      setMaintenance(maintenanceData || [])

      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('*')
        .eq('unit_id', id)
        .order('created_at', { ascending: false })

      setComplaints(complaintsData || [])

      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select('*')
        .eq('unit_id', id)
        .order('created_at', { ascending: false })

      setSuggestions(suggestionsData || [])

      setLoading(false)
    }

    loadUnitData()
  }, [id])

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