// Minimal service worker: caches the app shell so the UI still loads
// (offline / flaky connection) even though live Supabase data obviously
// still needs a network connection to actually fetch or submit anything.
const CACHE_NAME = 'madonna-community-shell-v1'
const SHELL_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Never intercept Supabase API calls — always go to the network for those.
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

// Real push notifications — fired by the send-announcement-push Edge
// Function whenever a new announcement is posted.
self.addEventListener('push', (event) => {
  let data = { title: 'Madonna Community', body: 'You have a new update.', url: '/' }
  try {
    data = { ...data, ...event.data.json() }
  } catch {
    // fall back to defaults if the payload isn't JSON
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

// Tapping the notification focuses an existing tab if one's open,
// otherwise opens a new one at the relevant page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})