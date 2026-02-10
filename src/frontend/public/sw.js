// Generate cache version from service worker script URL query parameter
// This allows the frontend to version the SW and trigger cache invalidation
const getCacheVersion = () => {
  try {
    const url = new URL(self.location.href);
    const version = url.searchParams.get('v');
    return version || 'v1';
  } catch (e) {
    return 'v1';
  }
};

const CACHE_VERSION = getCacheVersion();
const CACHE_NAME = `hans-laser-precache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hans-laser-runtime-${CACHE_VERSION}`;

console.log(`Service worker script loaded with cache version: ${CACHE_VERSION}`);

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/generated/hans-laser-favicon.dim_32x32.png',
  '/assets/generated/hans-laser-apple-touch-icon.dim_180x180.png',
  '/assets/generated/android-app-icon.dim_192x192.png',
  '/assets/generated/android-app-icon.dim_512x512.png',
  '/manifest.webmanifest'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log(`Service worker installing with cache version: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        console.log(`Service worker installed successfully with cache version: ${CACHE_VERSION}`);
      })
      .catch((err) => {
        console.error('Service worker install failed:', err);
        throw err;
      })
  );
  // Don't auto-activate - wait for user confirmation via SKIP_WAITING message
});

// Activate event - clean up old versioned caches
self.addEventListener('activate', (event) => {
  console.log(`Service worker activating with cache version: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((name) => {
          // Delete any cache that doesn't match current version
          const isOldCache = name.startsWith('hans-laser-') && 
                 name !== CACHE_NAME && 
                 name !== RUNTIME_CACHE;
          if (isOldCache) {
            console.log(`Deleting old cache: ${name}`);
          }
          return isOldCache;
        })
        .map((name) => caches.delete(name));
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log(`Service worker activated with cache version: ${CACHE_VERSION}`);
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      console.log('Service worker claimed all clients');
    })
  );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message, activating new service worker...');
    self.skipWaiting();
  }
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-first strategy for API calls and dynamic content
  // Cache-first for static assets
  if (url.pathname.startsWith('/api') || url.pathname.includes('canister')) {
    // Network-first for backend calls
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Return app shell for navigation requests when offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
    );
  }
});
