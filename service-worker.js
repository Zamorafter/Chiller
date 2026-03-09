const CACHE_NAME = 'chiller-cache-v1';
const urlsToCache = [
  '/chiller-app/',
  '/chiller-app/index.html',
  '/chiller-app/login.html',
  '/chiller-app/main.html',
  '/chiller-app/chiller.html',
  '/chiller-app/css/style.css',
  '/chiller-app/js/auth.js',
  '/chiller-app/js/db.js',
  '/chiller-app/js/excel.js',
  '/chiller-app/js/ui.js',
  '/chiller-app/libs/xlsx.full.min.js',
  '/chiller-app/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
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