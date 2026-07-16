import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(undefined)

/**
 * Normalizes a raw `profiles` row into the shape the UI consumes.
 * The `profiles` table stores `full_name`, but every dashboard greets
 * the user with `user.name` — normalize once, here, so no component
 * has to know about the column name mismatch.
 */
function normalizeProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.full_name || 'Resident',
    fullName: row.full_name || 'Resident',
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setUnit(null)
      return
    }
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Failed to load profile:', profileError.message)
      setProfile(null)
      setUnit(null)
      return
    }
    setProfile(normalizeProfile(profileRow))

    const { data: unitRow, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('resident_id', userId)
      .maybeSingle()

    if (unitError) {
      console.error('Failed to load unit:', unitError.message)
      console.error('unitError.details:', unitError.details)
      console.error('unitError.hint:', unitError.hint)
    }

    setUnit(unitRow || null)

  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      setSession(session)

      if (session?.user?.id) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session?.user?.id) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setUnit(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(() => {
    if (session?.user?.id) return loadProfile(session.user.id)
  }, [session, loadProfile])

  const value = {
    session,
    user: profile,
    unit,
    role: profile?.role || null,
    loading,
    signIn,
    signOut,
    refreshProfile,

    isStaff:
      profile?.role === 'caretaker' ||
      profile?.role === 'chairperson' ||
      profile?.role === 'landlady',

    canManageUnits:
      profile?.role === 'chairperson' ||
      profile?.role === 'landlady' ||
      profile?.role === 'caretaker',

    canManagePayments:
      profile?.role === 'chairperson' ||
      profile?.role === 'landlady',

    canManageMessages: !!profile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
