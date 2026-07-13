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
