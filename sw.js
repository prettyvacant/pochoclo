// Service Worker — auto-update on new version
const CACHE = 'tutuca-v2026-05-25-001';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(['./', './manifest.json', './icon.png', './icon.svg']);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Network first — always gets latest version
  e.respondWith(
    fetch(e.request).then(function(res) {
      const copy = res.clone();
      caches.open(CACHE).then(function(cache) {
        cache.put(e.request, copy);
      });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', function(e) {
  if(e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
