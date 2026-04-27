const CACHE_NAME = "living-with-predators-v1";
const PRECACHE_URLS = ["./", "./index.html", "./manifest.json", "./offline.html"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function fromNetwork(request) {
  return fetch(request).then((response) => {
    if (!response || response.status !== 200 || response.type !== "basic") {
      return response;
    }
    const responseClone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
    return response;
  });
}

function fromCache(request) {
  return caches.match(request).then((cached) => cached || Promise.reject("no-match"));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith(
      fromNetwork(request).catch(() => fromCache("offline.html")),
    );
    return;
  }

  if (request.destination === "image" || request.url.includes("/species/")) {
    event.respondWith(
      fromCache(request).catch(() => fromNetwork(request)),
    );
    return;
  }

  event.respondWith(
    fromNetwork(request).catch(() => fromCache(request)),
  );
});
