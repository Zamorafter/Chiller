const CACHE_NAME = 'chiller-cache-v4';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './main.html',
  './chiller.html',
  './css/style.css',
  './js/auth.js',
  './js/db.js',
  './js/excel.js',
  './js/pwa.js',
  './js/ui.js',
  './libs/xlsx.full.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
        .catch(() => caches.match('./login.html')))
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
