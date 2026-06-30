// VN Commerce Service Worker v1.0

const CACHE_VERSION = 'vn-commerce-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/produtos',
  '/offline',
  '/manifest.json',
]

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('vn-commerce-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // API calls — network first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    )
    return
  }

  // Images — cache first
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached ?? new Response('', { status: 404 }))
        })
      )
    )
    return
  }

  // Navigation — network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached ?? caches.match('/offline'))
        )
    )
    return
  }

  // Static assets — stale while revalidate
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        return cached ?? fetchPromise
      })
    )
  )
})

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VN Commerce', {
      body: data.body ?? '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url ?? '/' },
      actions: data.actions ?? [],
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus()
      }
      return clients.openWindow(targetUrl)
    })
  )
})

// ─── Background Sync (for offline order queue) ────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders())
  }
})

async function syncPendingOrders() {
  // Future: sync orders created while offline
  console.log('[SW] Background sync triggered')
}
