const isLocalhost = self.location.hostname === 'localhost'
const CACHE_NAME = 'senal-shell-v1'

// Evento install — cachear el shell de la app (index.html) para soporte offline
self.addEventListener('install', event => {
  if (isLocalhost) console.log('[SW] Instalando Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      fetch('/index.html').then(response => cache.put('/index.html', response))
    ).then(() => self.skipWaiting())
  )
})

// Evento activate — limpiar caches viejos y tomar control
self.addEventListener('activate', event => {
  if (isLocalhost) console.log('[SW] Service Worker activado')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => clients.claim())
  )
})

self.addEventListener('push', event => {
  if (isLocalhost) console.log('[SW] Push recibido:', event)

  let data = {
    title: 'Nueva notificación',
    body: 'Tienes un nuevo mensaje',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/'
  }

  try {
    if (event.data) {
      const parsed = event.data.json()
      if (isLocalhost) console.log('[SW] Datos parseados:', parsed)
      data = { ...data, ...parsed }
    }
  } catch (error) {
    if (isLocalhost) console.error('[SW] Error parseando payload push:', error)
    try {
      if (event.data) {
        data.body = event.data.text()
      }
    } catch (e) {
      if (isLocalhost) console.error('[SW] Error parseando como texto:', e)
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url },
    requireInteraction: true,
    tag: 'push-notification-' + Date.now()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = event.notification?.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Handler fetch — nunca interceptar llamadas a la API; fallback offline a index.html
self.addEventListener('fetch', event => {
  const request = event.request

  // No interceptar requests a la API
  if (request.url.includes('/api/')) return

  // Solo interceptar navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(cached => cached ?? new Response('Offline', { status: 503 }))
      )
    )
  }
})
