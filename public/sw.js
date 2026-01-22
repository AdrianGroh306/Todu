const CACHE_NAME = "clarydo-cache-v2";
const OFFLINE_URLS = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];

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

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "clarydo",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Clarydo", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      return clients.openWindow(url);
    }),
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

  // Never cache API responses – always hit the network for dynamic data
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Always go to network for navigations so we don't show stale HTML on refresh
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached ?? caches.match("/");
      }),
    );
    return;
  }

  // Cache-first for static assets only
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
