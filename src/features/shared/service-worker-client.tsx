"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export const ServiceWorkerClient = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: "/",
        });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    register();
  }, []);

  return null;
}
