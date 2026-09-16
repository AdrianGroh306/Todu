"use client";

import { useEffect, useState } from "react";

/** Keeps an element mounted for `exitMs` after `open` turns false so it can animate out. */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted: open || mounted, closing: !open && mounted };
}

/** Returns the last value seen while open, so closing content doesn't change mid-animation. */
export function useFrozenWhileClosed<T>(value: T, open: boolean): T {
  const [frozen, setFrozen] = useState(value);
  if (open && frozen !== value) setFrozen(value);
  return open ? value : frozen;
}
