"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export const postToServiceWorker = (message: { type: string }) => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.controller?.postMessage(message);
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
    };
  }, []);

  return null;
}
