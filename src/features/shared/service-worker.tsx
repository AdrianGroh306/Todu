"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";
const CHUNK_ERROR_RELOADED_KEY = "todu-chunk-error-reloaded";
const CHUNK_ERROR_PATTERN = /ChunkLoadError|Loading chunk [\d\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module/i;

export const postToServiceWorker = (message: { type: string }) => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.controller?.postMessage(message);
};

// A cached app shell can outlive the deployment it was built for: its script
// tags point at hashed chunk files that no longer exist once a new version
// ships. Recover once by dropping the service worker (and its cached shell)
// and forcing a real network reload, instead of leaving the user stuck on
// the generic "client-side exception" crash screen.
const recoverFromStaleChunk = () => {
  if (sessionStorage.getItem(CHUNK_ERROR_RELOADED_KEY)) return;
  sessionStorage.setItem(CHUNK_ERROR_RELOADED_KEY, "1");

  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {})
    .finally(() => window.location.reload());
};

export const ServiceWorker = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH, { scope: "/" })
      .catch((error) => console.error("Service worker registration failed", error));

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SESSION_EXPIRED" && !window.location.pathname.startsWith("/sign-")) {
        window.location.href = "/sign-in";
      }
    };

    const handleScriptError = (event: ErrorEvent) => {
      if (CHUNK_ERROR_PATTERN.test(event.message ?? "")) recoverFromStaleChunk();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === "string" ? reason : reason?.message;
      if (CHUNK_ERROR_PATTERN.test(message ?? "")) recoverFromStaleChunk();
    };

    window.addEventListener("error", handleScriptError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Snapshot the latest state when the app is left, so the next launch starts from it
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && window.location.pathname === "/") {
        postToServiceWorker({ type: "REFRESH_SHELL" });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("error", handleScriptError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
