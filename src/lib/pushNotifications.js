import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Web Push requires the VAPID public key as a Uint8Array, but env vars
// (and the key as generated) are base64url strings — this converts it.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ])
}

export async function getPushStatus() {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      8000,
      'Service worker did not activate in time.'
    )
    const existing = await registration.pushManager.getSubscription()
    return existing ? 'subscribed' : 'not-subscribed'
  } catch (err) {
    console.error('getPushStatus failed:', err.message)
    return 'error'
  }
}

export async function subscribeToPush(profileId) {
  if (!isPushSupported()) throw new Error('Push notifications are not supported on this device/browser.')
  if (!VAPID_PUBLIC_KEY) throw new Error('Missing VITE_VAPID_PUBLIC_KEY in your .env file.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    8000,
    'Service worker did not activate in time. Try reloading the page.'
  )
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      profile_id: profileId,
      subscription: subscription.toJSON(),
    },
    { onConflict: 'profile_id,subscription' }
  )
  if (error) throw error

  return subscription
}

export async function unsubscribeFromPush(profileId) {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('profile_id', profileId)
      .eq('subscription', JSON.stringify(subscription.toJSON()))
    await subscription.unsubscribe()
  }
}

