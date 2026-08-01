const CACHE_NAME = 'oli-workbench-v12';
const ASSETS = [
  '/oli-workbench/index.html',
  '/oli-workbench/manifest.json',
  '/oli-workbench/cat-icon-192.png',
  '/oli-workbench/cat-icon-512.png',
  '/oli-workbench/favicon.png',
  '/oli-workbench/apple-icon-120.png',
  '/oli-workbench/apple-icon-152.png',
  '/oli-workbench/apple-icon-167.png',
  '/oli-workbench/apple-icon-180.png',
  '/oli-workbench/apple-icon-192.png',
  '/oli-workbench/apple-icon-512.png'
];

// Network-first strategy: always try network, fallback to cache
// This ensures users always get the latest version
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  // 不自动 skipWaiting，避免页面被意外接管
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  // 不自动 claim，让用户下次打开时自然切换
});

self.addEventListener('fetch', event => {
  // For HTML pages: network-first (always fetch latest)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});

// Notify client when new version is available
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
