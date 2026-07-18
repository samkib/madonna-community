import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Use the Edge runtime's global `Deno.serve` without relying on TS types.
const serve = (globalThis as any).Deno?.serve
if (!serve) {
  throw new Error('Deno runtime not detected.')
}

serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { month, year } = await req.json()

    const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL')
    const serviceRoleKey = (globalThis as any).Deno?.env?.get(
      'SUPABASE_SERVICE_ROLE_KEY'
    )

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing env vars (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)'
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select(`
        id,
        resident_id,
        rent_amount
      `)
      .eq('status', 'occupied')
      .not('resident_id', 'is', null)

    if (unitsError) {
      throw unitsError
    }

    const records = (units || []).map((unit: any) => ({
      resident_id: unit.resident_id,
      unit_id: unit.id,
      month,
      year,
      rent_amount: unit.rent_amount,
      amount_paid: 0,
      status: 'pending',
    }))

    const { error } = await supabase
      .from('payments')
      .upsert(records, {
        onConflict: 'resident_id,month,year',
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: records.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

