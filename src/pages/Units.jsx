import { useEffect, useState } from 'react'
import { Building2, Plus, UserMinus, UserPlus, Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import UnitPlaque from '../components/UnitPlaque'

export default function Units() {
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [addUnitError, setAddUnitError] = useState('')
  const [addUnitSubmitting, setAddUnitSubmitting] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignUnit, setAssignUnit] = useState(null)
  const [assignForm, setAssignForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [assignError, setAssignError] = useState('')
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const [removingId, setRemovingId] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('units')
      .select('*, profiles:resident_id(full_name, email, phone)')
      .order('unit_number', { ascending: true })
    if (!error) setUnits(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAddUnit(e) {
    e.preventDefault()
    setAddUnitError('')
    setAddUnitSubmitting(true)
    const { error } = await supabase.from('units').insert({
      unit_number: newUnitNumber,
      status: 'vacant',
    })
    setAddUnitSubmitting(false)
    if (error) {
      setAddUnitError(error.message)
      return
    }
    setNewUnitNumber('')
    setAddUnitOpen(false)
    load()
  }

  function openAssign(unit) {
    setAssignUnit(unit)
    setAssignForm({ full_name: '', email: '', phone: '', password: '' })
    setAssignError('')
    setAssignOpen(true)
  }

  async function handleAssign(e) {
    e.preventDefault()
    setAssignError('')
    setAssignSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('create-resident', {
        body: {
          full_name: assignForm.full_name,
          email: assignForm.email,
          phone: assignForm.phone,
          password: assignForm.password,
          unit_id: assignUnit.id,
        },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setAssignOpen(false)
      load()
    } catch (err) {
      setAssignError(
        err.message ||
          'Could not create the resident. Make sure the create-resident Edge Function is deployed.'
      )
    } finally {
      setAssignSubmitting(false)
    }
  }

  async function handleRemove(unit) {
    setRemovingId(unit.id)
    await supabase
      .from('units')
      .update({ resident_id: null, status: 'vacant' })
      .eq('id', unit.id)
    setRemovingId(null)
    load()
  }

  const filtered = units.filter((u) => {
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    const matchesSearch =
      !search ||
      u.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
      u.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit or resident…"
              className="input-field !pl-9 !py-2 text-sm w-56"
            />
          </div>
          {['All', 'occupied', 'vacant'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-plaque text-xs font-medium border capitalize transition-colors ${
                statusFilter === s ? 'bg-primary text-accent-soft border-primary' : 'border-line text-ink-soft hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setAddUnitOpen(true)} className="btn-primary">
          <Plus size={16} /> Add unit
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No units found." hint="Add your first unit to get started." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u.id} className="estate-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <UnitPlaque unitNumber={u.unit_number} />
                <span
                  className={`badge ${
                    u.status === 'occupied' ? 'bg-solved/15 text-solved' : 'bg-surface-alt text-ink-soft'
                  }`}
                >
                  {u.status}
                </span>
              </div>
              {u.status === 'occupied' && u.profiles ? (
                <div>
                  <p className="text-sm font-medium text-ink">{u.profiles.full_name}</p>
                  <p className="text-xs text-ink-soft">{u.profiles.email}</p>
                </div>
              ) : (
                <p className="text-sm text-ink-soft italic">Vacant unit</p>
              )}
              <div className="mt-auto pt-2">
                {u.status === 'occupied' ? (
                  <button
                    onClick={() => handleRemove(u)}
                    disabled={removingId === u.id}
                    className="btn-secondary w-full !py-2 text-sm"
                  >
                    <UserMinus size={14} />
                    {removingId === u.id ? 'Removing…' : 'Remove resident'}
                  </button>
                ) : (
                  <button onClick={() => openAssign(u)} className="btn-primary w-full !py-2 text-sm">
                    <UserPlus size={14} /> Add resident
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addUnitOpen} onClose={() => setAddUnitOpen(false)} title="Add a unit">
        <form onSubmit={handleAddUnit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Unit number</label>
            <input
              required
              className="input-field"
              value={newUnitNumber}
              onChange={(e) => setNewUnitNumber(e.target.value)}
              placeholder="e.g. B204"
            />
          </div>
          {addUnitError ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{addUnitError}</p> : null}
          <button type="submit" disabled={addUnitSubmitting} className="btn-primary w-full">
            {addUnitSubmitting ? 'Adding…' : 'Add unit'}
          </button>
        </form>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Add resident to ${assignUnit?.unit_number || ''}`}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Full name</label>
            <input
              required
              className="input-field"
              value={assignForm.full_name}
              onChange={(e) => setAssignForm({ ...assignForm, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
            <input
              required
              type="email"
              className="input-field"
              value={assignForm.email}
              onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Phone number</label>
            <input
              required
              className="input-field"
              value={assignForm.phone}
              onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })}
              placeholder="07XX XXX XXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Temporary password</label>
            <input
              required
              type="text"
              minLength={6}
              className="input-field"
              value={assignForm.password}
              onChange={(e) => setAssignForm({ ...assignForm, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </div>
          {assignError ? <p className="text-sm text-urgent bg-urgent/10 rounded-plaque px-3 py-2">{assignError}</p> : null}
          <button type="submit" disabled={assignSubmitting} className="btn-primary w-full">
            {assignSubmitting ? 'Creating account…' : 'Create resident account'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
