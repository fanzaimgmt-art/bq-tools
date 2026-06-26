// BQ Tools — Service Worker
// Caches app shell for offline use; network-first for API calls.

const VERSION = 'bq-v10';
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

  // Cross-origin (CDN assets like Leaflet/unpkg, fonts, AI APIs): DO NOT intercept —
  // let the browser fetch natively. Substituting a 503 JSON here broke cross-origin
  // <script>/<link> (e.g. Leaflet → "L is not defined", map + listings failed to render).
  if (url.origin !== location.origin) {
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

  // JS/CSS: NETWORK-FIRST so code updates always reach users (cache-first here was
  // serving stale JS — e.g. an old common.js without the language picker — until a
  // version bump). Fall back to cache only when offline.
  if (req.destination === 'script' || req.destination === 'style' || /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Images + other static: cache-first (rarely change, big)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.destination === 'image') return caches.match('/img/icon-192.png');
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
