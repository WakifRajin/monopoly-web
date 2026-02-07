/**
 * Service Worker for Monopoly PWA
 * Provides offline support and caching for the game
 */

const CACHE_NAME = 'monopoly-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.html',
  '/css/main.css',
  '/css/mobile.css',
  '/js/utils/constants.js',
  '/js/utils/helpers.js',
  '/js/network/socketClient.js',
  '/js/core/board.js',
  '/js/core/game.js',
  '/js/core/animations.js',
  '/js/ui/lobby.js',
  '/js/ui/chat.js',
  '/js/ui/notifications.js',
  '/js/ui/propertyCard.js',
  '/js/ui/trade.js',
  '/js/ui/auction.js',
  '/js/ui/persistence.js',
  '/js/ui/stats.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Skip API calls - always use network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable', offline: true }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Use cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', request.url);
          return response;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[ServiceWorker] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html').then((offlineResponse) => {
                return offlineResponse || new Response(
                  '<html><body><h1>Offline</h1><p>You are offline. Please check your connection.</p></body></html>',
                  { headers: { 'Content-Type': 'text/html' } }
                );
              });
            }

            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[ServiceWorker] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls).then(() => {
          console.log('[ServiceWorker] URLs cached');
          event.ports[0].postMessage({ success: true });
        });
      })
    );
  }
});

// Background sync - for future implementation
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-game-state') {
    event.waitUntil(syncGameState());
  }
});

// Push notification - for future implementation
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New game update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Game',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Monopoly Game', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync game state (placeholder for future implementation)
async function syncGameState() {
  try {
    // In a real implementation, this would fetch from the server
    // For now, this is just a placeholder
    console.log('[ServiceWorker] Sync game state (not implemented)');
    
    // Future implementation could:
    // 1. Check if there's pending game state in IndexedDB
    // 2. Send it to the server via fetch
    // 3. Handle the response
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Periodic background sync (future implementation)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-game-state') {
    event.waitUntil(syncGameState());
  }
});

console.log('[ServiceWorker] Service Worker loaded');
