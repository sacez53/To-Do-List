const CACHE_NAME = 'todo-list-cache-v14';
const urlsToCache = [
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
  if (event.request.url.includes('firebasedatabase.app')) {
    return;
  }
  
  // Stratégie Réseau d'abord (Network First) pour le HTML, JS et CSS, Cache d'abord pour le reste
  const isHtml = event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html');
  const isCode = event.request.url.includes('.js') || event.request.url.includes('.css');

  if (isHtml || isCode) {
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
