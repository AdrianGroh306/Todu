"use client";

import { useEffect } from "react";

/**
 * Hook that syncs the visual viewport to CSS variables for iOS PWA keyboard handling.
 * Sets:
 * - --vvh: visual viewport height (shrinks when keyboard opens)
 * - --vvo: visual viewport offset (how much iOS scrolled the page)
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function syncViewport() {
      if (!vv) return;

      // Height of visible area (excluding keyboard)
      // Set on both html and body to ensure CSS can use it
      const height = `${vv.height}px`;
      document.documentElement.style.setProperty("--vvh", height);
      document.body.style.setProperty("--vvh", height);

      // Reset any scroll that iOS might have added
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }

    // Set initial value
    syncViewport();

    // Update on resize (keyboard open/close) and scroll
    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);

    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
    };
  }, []);
}
