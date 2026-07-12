// Supabase Edge Function: create-resident
//
// Creates a resident's auth account + profile + unit assignment in one
// atomic-ish step. Runs with the service role key so it can call
// supabase.auth.admin.createUser — something the browser must never do
// directly, since that would require shipping the service role key to
// the client. Only chairperson/landlady callers are allowed through.
//
// Deploy with:
//   supabase functions deploy create-resident
//
// Required secrets (set automatically for you on Supabase, or via
// `supabase secrets set` for local dev):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Client scoped to the caller's own JWT — used only to verify who is calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return jsonResponse({ error: 'Not authenticated.' }, 401)
    }

    const { data: callerProfile, error: callerProfileError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfileError || !['chairperson', 'landlady'].includes(callerProfile?.role)) {
      return jsonResponse({ error: 'Only the chairperson or landlady can add residents.' }, 403)
    }

    const { full_name, email, phone, password, unit_id } = await req.json()

    if (!full_name || !email || !password || !unit_id) {
      return jsonResponse({ error: 'full_name, email, password and unit_id are all required.' }, 400)
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400)
    }

    // Admin client — service role key, never exposed to the browser.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: unit, error: unitError } = await adminClient
      .from('units')
      .select('id, status')
      .eq('id', unit_id)
      .single()

    if (unitError || !unit) {
      return jsonResponse({ error: 'Unit not found.' }, 404)
    }
    if (unit.status === 'occupied') {
      return jsonResponse({ error: 'That unit already has a resident.' }, 409)
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message || 'Could not create the account.' }, 400)
    }

    const newUserId = created.user.id

    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUserId,
      full_name,
      email,
      phone,
      role: 'resident',
    })

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned account behind.
      await adminClient.auth.admin.deleteUser(newUserId)
      return jsonResponse({ error: profileError.message }, 400)
    }

    const { error: unitUpdateError } = await adminClient
      .from('units')
      .update({ resident_id: newUserId, status: 'occupied' })
      .eq('id', unit_id)

    if (unitUpdateError) {
      return jsonResponse({ error: unitUpdateError.message }, 400)
    }

    return jsonResponse({ success: true, user_id: newUserId })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500)
  }
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
