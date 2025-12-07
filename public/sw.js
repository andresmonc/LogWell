// Service Worker for LogWell PWA - Full Offline Support
// Since the app uses local storage, it can work completely offline once assets are cached

const CACHE_NAME = 'logwell-v1';
const STATIC_CACHE_NAME = 'logwell-static-v1';

// Initial URLs to cache on install
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching initial resources');
        // Cache index.html and root, other assets will be cached on demand
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('[SW] Cache install failed:', error);
          // Don't fail installation if some resources can't be cached
        });
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - Cache First strategy for offline support
// This ensures the app works completely offline since all data is in local storage
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (CDN fonts, etc.) - let browser handle them
  if (url.origin !== location.origin && !url.href.includes('cdn.jsdelivr.net')) {
    return;
  }

  // For same-origin requests, use Cache First strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available (offline support)
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || response.type !== 'basic' || request.method !== 'GET') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Determine which cache to use
            const cacheToUse = isStaticAsset(request.url) ? STATIC_CACHE_NAME : CACHE_NAME;

            caches.open(cacheToUse)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.error('[SW] Failed to cache:', request.url, error);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', request.url, error);
            
            // For navigation requests, return index.html (SPA routing)
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }

            // For other requests, return a basic error response
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Helper function to determine if an asset is static (JS, CSS, images, fonts)
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.includes(ext));
}

