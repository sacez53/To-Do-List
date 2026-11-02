const CACHE_NAME = 'todo-list-cache-v16';
const urlsToCache = [
  './assets/js/push-model.js?v=16',
  './assets/js/notifications.js?v=16',
  './',
  './index.html',
  './pages/app-v2.html',
  './pages/calendar.html',
  './pages/settings.html',
  './pages/login.html',
  './pages/donnees.html',
  './pages/apropos.html',
  './pages/developpeur.html',
  './pages/confidentialite.html',
  './pages/mentions-legales.html',
  './pages/cgu.html',
  './assets/css/style2.css',
  './assets/js/i18n.js',
  './assets/js/app-v2.js',
  './assets/js/calendar.js',
  './assets/js/settings.js',
  './assets/js/transitions.js',
  './assets/js/burger-menu.js',
  './assets/js/crypto.js',
  './assets/js/timeout.js',
  './assets/js/donnees.js',
  './assets/logo/list-todo.svg',
  './assets/logo/logo-t.svg',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Bypass Service Worker cache for Firebase API requests
  if (new URL(event.request.url).origin !== self.location.origin || event.request.url.includes('firebasedatabase.app')) {
    return;
  }
  
  // Stratégie Réseau d'abord (Network First) pour le HTML, JS et CSS, Cache d'abord pour le reste
  const isHtml = event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html');
  const isCode = event.request.url.includes('.js') || event.request.url.includes('.css');

  if (isHtml || isCode || new URL(event.request.url).pathname.endsWith('/push.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(fetchRes => {
            if (fetchRes && fetchRes.status === 200) {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, fetchRes.clone());
                return fetchRes;
              });
            }
            return fetchRes;
          });
        })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Web Push uses the same standard on Chrome Android and installed iOS web apps.
// Always show a visible notification, including when the payload is empty.
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  const target = new URL('pages/app-v2.html', self.registration.scope);
  if (typeof payload.taskId === 'string' && payload.taskId.length <= 200) target.searchParams.set('viewTask', payload.taskId);
  event.waitUntil(self.registration.showNotification('Ma To-Do List', {
    body: typeof payload.body === 'string' ? payload.body.slice(0,300) : 'Une tâche arrive à échéance. Ouvrez votre liste pour la consulter.',
    icon: new URL('assets/icons/icon-192.png', self.registration.scope).href,
    badge: new URL('assets/icons/icon-192.png', self.registration.scope).href,
    tag: typeof payload.tag === 'string' ? payload.tag.slice(0,150) : 'todo-reminder',
    data: { url: target.href }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const fallback = new URL('pages/app-v2.html', self.registration.scope);
  let target;
  try { target = new URL(event.notification.data?.url || fallback.href); } catch (_) { target = fallback; }
  if (target.origin !== fallback.origin || target.pathname !== fallback.pathname) target = fallback;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type:'window',includeUncontrolled:true });
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
        await client.navigate(target.href); return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
