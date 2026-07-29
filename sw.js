const CACHE_NAME = 'oli-workbench-v1';
const ASSETS = [
  '/oli-workbench/index.html',
  '/oli-workbench/manifest.json',
  '/oli-workbench/cat-icon-192.png',
  '/oli-workbench/cat-icon-512.png',
  '/oli-workbench/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/oli-workbench/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
