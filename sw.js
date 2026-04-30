const CACHE_NAME = 'phc-advance-cache-v11';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/entry.js',
  '/js/edit.js',
  '/js/report.js',
  '/js/admin.js'
];

// Install Service Worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch events: Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Do not cache API calls (like Google Apps Script)
  if (event.request.url.includes('script.google.com')) {
    return; 
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
