

// Evento install - se activa inmediatamente sin esperar
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  self.skipWaiting(); // Forzar activación inmediata
});

// Evento activate - toma control de todas las pestañas abiertas
self.addEventListener('activate', event => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(clients.claim()); // Tomar control inmediato de los clientes
});

self.addEventListener('push', event => {
  console.log('[SW] Push recibido:', event);
  
  let data = {
    title: 'Nueva notificación',
    body: 'Tienes un nuevo mensaje',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    url: '/'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      console.log('[SW] Datos parseados:', parsed);
      data = { ...data, ...parsed };
    }
  } catch (error) {
    console.error('[SW] Error parseando payload push:', error);
    // Intentar como texto si JSON falla
    try {
      if (event.data) {
        data.body = event.data.text();
      }
    } catch (e) {
      console.error('[SW] Error parseando como texto:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: {
      url: data.url
    },
    requireInteraction: true,
    tag: 'push-notification-' + Date.now() // Evita que se agrupen/reemplacen
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});


self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handler fetch para SPA routing - permite que el servidor maneje las navigation requests
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Solo interceptar navigation requests (no assets, API calls, etc.)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Si falla el fetch (offline), intentar devolver index.html del cache
        return caches.match('/index.html');
      })
    );
  }
  // Para otros requests (assets, API), dejar pasar normalmente sin interceptar
});

