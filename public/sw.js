const CACHE_NAME = "todu-cache-v1.4.0";
const OFFLINE_URLS = ["/icons/icon-192.png", "/icons/icon-512.png"];
const SHELL_URL = "/";
const IS_DEV = ["localhost", "127.0.0.1"].includes(self.location.hostname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      // Don't skipWaiting automatically - let the app control when to update
  );
});

const notifyClients = async (message) => {
  const clientList = await self.clients.matchAll({ type: "window" });
  clientList.forEach((client) => client.postMessage(message));
};

// The shell HTML contains user data: only keep it while the user is authenticated.
const storeShell = async (response) => {
  const cache = await caches.open(CACHE_NAME);
  if (response.type === "opaqueredirect" || response.redirected || !response.ok) {
    const hadShell = await cache.delete(SHELL_URL);
    if (hadShell && response.type === "opaqueredirect") {
      await notifyClients({ type: "SESSION_EXPIRED" });
    }
    return;
  }
  await cache.put(SHELL_URL, response);
};

const refreshShell = () =>
  fetch(SHELL_URL, { credentials: "same-origin", redirect: "manual" })
    .then(storeShell)
    .catch(() => {});

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (type === "REFRESH_SHELL" && !IS_DEV) {
    event.waitUntil(refreshShell());
  } else if (type === "CLEAR_SHELL") {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.delete(SHELL_URL)));
  }
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
    tag: data.tag || "todu",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Todu", options));
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

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build assets are immutable. Caching them keeps a cached shell bootable after a deploy.
  if (url.pathname.startsWith("/_next/static/")) {
    if (IS_DEV) return;
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/") ||
    request.headers.get("RSC") === "1" ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    // App start: show the last shell instantly and refresh it in the background.
    if (url.pathname === SHELL_URL && !IS_DEV) {
      event.respondWith(
        caches.match(SHELL_URL).then((cached) => {
          const network = fetch(request).then((response) => {
            event.waitUntil(storeShell(response.clone()));
            return response;
          });

          if (cached) {
            event.waitUntil(network.catch(() => {}));
            return cached;
          }
          return network;
        }),
      );
      return;
    }

    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(SHELL_URL);
        return cached ?? Response.error();
      }),
    );
    return;
  }

  // Other static assets: cache-first with background refresh
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        });

      return cached || fetchPromise;
    }),
  );
});
