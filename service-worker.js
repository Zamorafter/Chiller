const CACHE_NAME = 'chiller-cache-v3';
const urlsToCache = [
  '/chiller-app/',
  '/chiller-app/index.html',
  '/chiller-app/login.html',
  '/chiller-app/register.html',
  '/chiller-app/main.html',
  '/chiller-app/chiller.html',
  '/chiller-app/css/style.css',
  '/chiller-app/js/auth.js',
  '/chiller-app/js/db.js',
  '/chiller-app/js/excel.js',
  '/chiller-app/js/pwa.js',
  '/chiller-app/js/ui.js',
  '/chiller-app/libs/xlsx.full.min.js',
  '/chiller-app/manifest.json',
  '/chiller-app/icons/icon-192.png',
  '/chiller-app/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request)
        .then(networkResponse => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse)).catch(() => {});
          return networkResponse;
        })
        .catch(() => caches.match('/chiller-app/login.html')))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
