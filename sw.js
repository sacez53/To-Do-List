const CACHE_NAME = 'todo-list-cache-v7';
const urlsToCache = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/css/style2.css',
  './assets/js/transitions.js',
  './assets/js/burger-menu.js',
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
  
  // Stratégie Réseau d'abord (Network First) pour le HTML, Cache d'abord pour le reste
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(fetchRes => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
            });
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
