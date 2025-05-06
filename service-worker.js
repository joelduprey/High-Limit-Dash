const CACHE_NAME = 'high-limit-dash-cache-v61';
const urlsToCache = [
  'index.html',
  'icon.png',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@600&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Notify clients of new content
            self.clients.claim();
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'new-content' });
                });
            });
        })
    );
});

// Fetch event: Serve cached content or fetch from network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(networkResponse => {
                // Cache the new response for future use
                if (event.request.method === 'GET') {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            });
        })
    );
});

// Handle messages from clients
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
