// Supabase Edge Function: send-announcement-push
//
// Triggered by a Database Webhook on the `announcements` table (INSERT).
// Supabase calls this function automatically whenever a new announcement
// row is created — no manual invocation from the frontend needed.
//
// It looks up every stored push subscription and sends each resident's
// browser a real push notification, using the VAPID keypair configured
// as Supabase secrets.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const announcement = payload?.record

    if (!announcement) {
      return new Response(
        JSON.stringify({
          error: 'No announcement record in payload.',
        }),
        {
          status: 400,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    // Change this email to one you actually control.
    const vapidSubject =
      Deno.env.get('VAPID_SUBJECT') || 'mailto:sophie@madonna.com'

    // Make sure all required secrets exist.
    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return new Response(
        JSON.stringify({
          error: 'Missing environment variables.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { data: subscriptions, error } = await adminClient
      .from('push_subscriptions')
      .select('id, subscription')

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 500,
        }
      )
    }

    const notificationPayload = JSON.stringify({
      title: announcement.is_urgent
        ? `Urgent: ${announcement.title}`
        : announcement.title,

      body: announcement.message,

      url: '/announcements',
    })

    const results = await Promise.allSettled(
      (subscriptions || []).map(async (row) => {
        try {
          await webpush.sendNotification(
            row.subscription,
            notificationPayload
          )
        } catch (err: any) {
          // Browser cleared data or unsubscribed.

          if (
            err?.statusCode === 410 ||
            err?.statusCode === 404
          ) {
            await adminClient
              .from('push_subscriptions')
              .delete()
              .eq('id', row.id)
          }

          throw err
        }
      })
    )

    const sent = results.filter(
      (r) => r.status === 'fulfilled'
    ).length

    const failed = results.length - sent

    return new Response(
      JSON.stringify({
        sent,
        failed,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : 'Unexpected error.',
      }),
      {
        status: 500,
      }
    )
  }
})