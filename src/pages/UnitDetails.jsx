import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'

export default function UnitDetails() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [complaints, setComplaints] = useState([])
  const [suggestions, setSuggestions] = useState([])

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
          </>
        ) : (
          <p>This unit is vacant.</p>
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