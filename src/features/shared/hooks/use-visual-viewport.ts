"use client";

import { useEffect } from "react";

/**
 * Syncs the visual viewport height to --vvh for iOS PWA keyboard handling.
 * Pass enabled=false for closed modals so they don't register duplicate listeners.
 */
export function useVisualViewport(enabled = true) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !enabled) return;

    function syncViewport() {
      if (!vv) return;

      const height = `${vv.height}px`;
      document.documentElement.style.setProperty("--vvh", height);
      document.body.style.setProperty("--vvh", height);

      // Reset any scroll that iOS might have added
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }

    syncViewport();

    vv.addEventListener("resize", syncViewport, { passive: true });
    vv.addEventListener("scroll", syncViewport, { passive: true });

    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
    };
  }, [enabled]);
}
