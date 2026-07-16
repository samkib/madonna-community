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
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return jsonResponse(
        { error: 'Not authenticated.' },
        401
      )
    }

    const {
      data: callerProfile,
      error: profileError,
    } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (
      profileError ||
      !['chairperson', 'landlady'].includes(
        callerProfile?.role
      )
    ) {
      return jsonResponse(
        {
          error:
            'Only the chairperson or landlady can remove residents.',
        },
        403
      )
    }

    const { resident_id } = await req.json()

    if (!resident_id) {
      return jsonResponse(
        { error: 'resident_id is required.' },
        400
      )
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { error: rpcError } = await adminClient.rpc(
      'remove_resident',
      {
        p_resident_id: resident_id,
      }
    )

    if (rpcError) {
      return jsonResponse(
        { error: rpcError.message },
        400
      )
    }

    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(
        resident_id
      )

    if (deleteAuthError) {
      return jsonResponse(
        { error: deleteAuthError.message },
        400
      )
    }

    return jsonResponse({
      success: true,
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