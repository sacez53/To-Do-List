const CACHE_NAME = 'todo-list-cache-v27';
const urlsToCache = [
  './', './index.html', './manifest.json',
  ...['app', 'app-v2', 'calendar', 'settings', 'login', 'welcome', 'donnees', 'apropos', 'developpeur', 'confidentialite', 'mentions-legales', 'cgu', 'commentaires'].map(page => `./pages/${page}.html`),
  './assets/css/style2.css?v=27', './assets/css/interface.css?v=27', './assets/css/pages.css?v=27',
  ...['runtime', 'dialogs', 'quick-capture', 'task-dates', 'task-store', 'i18n', 'app-v2', 'calendar', 'settings', 'login', 'transitions', 'burger-menu', 'crypto', 'timeout', 'donnees', 'commentaires'].map(script => `./assets/js/${script}.js?v=27`),
  ...['firebase', 'security', 'settings', 'ui', 'version'].map(name => `./assets/json/${name}.json`),
  './assets/logo/list-todo.svg', './assets/logo/logo-t.svg',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  // Existing sessions keep their worker until they close.
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  const fresh = event.request.mode === 'navigate' || /\.(html|js|css|json)$/.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (!fresh && cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') await cache.put(event.request, response.clone());
      return response;
    } catch (_) {
      return cached || new Response('Hors ligne / Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('todo-list-cache-') && name !== CACHE_NAME).map(name => caches.delete(name)))));
});
