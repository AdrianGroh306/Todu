"use client";

import { useEffect, useState } from "react";

type UpdateState = {
  hasUpdate: boolean;
  isUpdating: boolean;
  applyUpdate: () => void;
};

export function useServiceWorkerUpdate(): UpdateState {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      // New service worker took over - reload the page
      window.location.reload();
    };

    const registerAndListen = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
        }

        // Listen for new updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version is ready and waiting
              setWaitingWorker(newWorker);
            }
          });
        });

        // Reload when the new worker takes over
        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    void registerAndListen();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) return;
    setIsUpdating(true);
    // Tell the waiting worker to skip waiting and take over
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return {
    hasUpdate: Boolean(waitingWorker),
    isUpdating,
    applyUpdate,
  };
}
