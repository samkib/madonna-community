import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse(
        { error: 'Missing Authorization header.' },
        401
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()

    if (!caller) {
      return jsonResponse(
        { error: 'Not authenticated.' },
        401
      )
    }

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (
      !profile ||
      !['chairperson', 'landlady'].includes(profile.role)
    ) {
      return jsonResponse(
        { error: 'Unauthorized.' },
        403
      )
    }

    const {
      full_name,
      email,
      phone,
      password,
      unit_id,
      rent_amount,
      registration_number,
    } = await req.json()

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError) {
      return jsonResponse(
        { error: createError.message },
        400
      )
    }

    const userId = newUser.user.id

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        email,
        phone,
        role: 'resident',
        registration_number,
      })

    if (profileError) {
      return jsonResponse(
        { error: profileError.message },
        400
      )
    }

    const { error: unitError } = await adminClient
      .from('units')
      .update({
        resident_id: userId,
        status: 'occupied',
        rent_amount: rent_amount,
      })
      .eq('id', unit_id)

    if (unitError) {
      return jsonResponse(
        { error: unitError.message },
        400
      )
    }

    return jsonResponse({
      success: true,
      resident_id: userId,
      unit_id,
    })
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unexpected error.',
      },
      500
    )
  }
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}