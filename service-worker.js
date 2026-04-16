// BQ Tools — Service Worker
// Caches app shell for offline use; network-first for API calls.

const VERSION = 'bq-v3';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Core files cached on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/home.html',
  '/style.css',
  '/js/common.js',
  '/js/ai.js',
  '/js/auth.js',
  '/js/crypto.js',
  '/js/business.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png',
];

// Install — precache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Never cache cross-origin AI APIs or admin calls
  if (url.origin !== location.origin) {
    // External: network only, fall back to offline response
    event.respondWith(fetch(req).catch(() => new Response(
      JSON.stringify({ error: 'Offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // API calls: network-first, don't cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req).catch(() => new Response(
      JSON.stringify({ error: 'Offline — connect to the internet and retry' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // Navigation requests (HTML pages): network-first, fall back to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Cache successful responses
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/home.html')))
    );
    return;
  }

  // Static assets (JS/CSS/images): cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Cache successful same-origin GET responses
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        // Fallback for images
        if (req.destination === 'image') {
          return caches.match('/img/icon-192.png');
        }
        throw new Error('Offline');
      });
    })
  );
});

// Background sync for queued actions (future)
self.addEventListener('sync', event => {
  if (event.tag === 'bq-sync-projects') {
    event.waitUntil(syncProjects());
  }
});

async function syncProjects() {
  // Placeholder for offline-queued project saves
  return true;
}

// Listen for messages from client to manually clear cache
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
