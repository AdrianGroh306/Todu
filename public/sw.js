const CACHE_NAME = "clarydo-cache-v1";
const OFFLINE_URLS = ["/", "/todos", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip RSC/Next.js internal requests - let the browser handle them directly
  const url = new URL(request.url);
  if (
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/") ||
    request.headers.get("RSC") === "1"
  ) {
    return;
  }

  // Only cache navigation requests and static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Return cached version or a proper error response
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        });

      return cached || fetchPromise;
    }),
  );
});
