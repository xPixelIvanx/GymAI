/* ============================================================
   GymAI Service Worker
   - Precaches the app shell on install (instant + offline load)
   - HTML navigations: Network-First, falling back to Cache
   - Static assets & fonts: Cache-First (with background fill)
   NOTE: localStorage is NOT touched by the SW. All routine/journal
   JSON stays in the device's localStorage and persists independently.
   ============================================================ */

const CACHE_VERSION = 'gymai-v2';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

/* App shell — everything needed to boot the app with no network. */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './conocimiento_youtube.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

/* ---- INSTALL: precache the shell, activate immediately ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Precache failed:', err))
  );
});

/* ---- ACTIVATE: drop old caches, take control of open pages ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Is this a navigation / document request? */
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' &&
     request.headers.get('accept') &&
     request.headers.get('accept').includes('text/html'));
}

/* ---- FETCH: route by request type ---- */
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET; let the browser deal with POST/etc.
  if (request.method !== 'GET') return;

  // 1) HTML pages → Network-First, fall back to cached shell (offline-safe)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // 2) Everything else (icons, fonts, css) → Cache-First, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache successful same-origin + CDN (e.g. Google Fonts) responses
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
    })
  );
});

/* Allow the page to trigger an immediate update if it wants. */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
