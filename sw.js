// Naikkan versi ini setiap kali index.html diperbarui
const CACHE_NAME = 'keuangan-pribadi-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache semua file penting
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama kalau ada update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: strategi Cache First untuk aset lokal, Network First untuk API kurs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Kalau request ke API kurs (Frankfurter) → utamakan network
  if (url.hostname.includes('frankfurter')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Kalau offline, kembalikan response kosong agar app handle sendiri
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Untuk semua aset lokal → cache dulu, fallback ke network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});