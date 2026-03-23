// sw.js — Cache-first service worker for Harvest PWA
//
// ── SUBDIRECTORY DEPLOYMENT ──────────────────────────────────────────────────
// If hosting at a subdirectory (e.g. username.github.io/harvest/), replace
// every leading '/' below with '/harvest/' — e.g. '/index.html' becomes
// '/harvest/index.html' — and update start_url in manifest.json to '/harvest/'.
// For root deployment (custom domain or username.github.io/) no changes needed.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE = 'harvest-v3';
const FONT_CACHE = 'harvest-fonts-v1';

const PRECACHE_URLS = [
  '/harvest/',
  '/harvest/index.html',
  '/harvest/css/styles.css',
  '/harvest/js/data.js',
  '/harvest/js/app.js',
  '/harvest/js/drag.js',
  '/harvest/manifest.json',
  '/harvest/icons/icon-192.png',
  '/harvest/icons/icon-512.png',
  '/harvest/icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts: stale-while-revalidate so offline falls back to cache
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        const networkFetch = fetch(e.request)
          .then(res => { cache.put(e.request, res.clone()); return res; })
          .catch(() => null);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Cache-first for all other requests
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
