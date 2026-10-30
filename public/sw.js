/* Minimal installable-app service worker. Private dashboard responses are not cached. */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Network-only: never persist authenticated dashboard or customer data in cache.
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(fetch(request))
})

// Display server-sent Web Push notifications even when the site window is closed.
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data?.text() || 'Une nouvelle commande est arrivée.' }
  }

  const title = payload.title || 'Nouvelle commande'
  const options = {
    body: payload.body || 'Ouvre ShopSaaS pour consulter la commande.',
    icon: '/icons/app-192.png',
    badge: '/icons/app-192.png',
    data: { url: payload.url || '/dashboard/orders' },
    tag: payload.tag || 'shopsaas-new-order',
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/dashboard/orders', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin))
      return existing ? existing.navigate(target).then(() => existing.focus()) : self.clients.openWindow(target)
    }),
  )
})
