const CACHE = "water-v9.0";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // Kein skipWaiting – warten bis App manuell updated
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  // Apps Script API calls immer live
  if (e.request.url.indexOf("script.google.com") >= 0) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // HTML: network first, cache fallback
      if (e.request.url.indexOf(".html") >= 0) {
        return fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
          return response;
        }).catch(function() { return cached; });
      }
      return cached || fetch(e.request);
    })
  );
});

// Update-Trigger vom App
self.addEventListener("message", function(e) {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
