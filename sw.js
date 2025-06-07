const CACHE_NAME = "video-player-cache-v1";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/assets/play.png"
];

// Optional: You can pre-cache these third-party libraries, or let them be cached on demand
const CDN_ASSETS = [
    "https://cdn.jsdelivr.net/npm/shaka-player/dist/shaka-player.ui.min.js",
    "https://cdn.jsdelivr.net/npm/shaka-player/dist/controls.min.css"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([...STATIC_ASSETS, ...CDN_ASSETS]);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Only cache GET requests
    if (req.method !== "GET") return;

    // Only cache HTML, CSS, JS files from same origin or trusted CDN
    const url = new URL(req.url);
    const isSameOrigin = url.origin === location.origin;
    const isStaticFile = /\.(html|css|js)$/.test(url.pathname);

    if (isSameOrigin && isStaticFile || CDN_ASSETS.includes(url.href)) {
        event.respondWith(
            caches.match(req).then((cachedResponse) => {
                return (
                    cachedResponse ||
                    fetch(req).then((networkResponse) => {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, networkResponse.clone());
                            return networkResponse;
                        });
                    })
                );
            })
        );
    }
});
