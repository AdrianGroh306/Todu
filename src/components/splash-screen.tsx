"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import { Check } from "lucide-react";

const SPLASH_GRADIENT =
  "linear-gradient(165deg, #4ade80 0%, #fbbf24 20%, #f97316 40%, #ec4899 60%, #818cf8 80%)";

// Rendered in the SSR HTML and animated purely by CSS, so it starts at first paint
// (not after hydration). CSS only shows it in standalone PWA mode; ?splash=1 forces it.
export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const forceShow = new URLSearchParams(window.location.search).get("splash") === "1";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (forceShow) setForced(true);
    else if (!isStandalone) setMounted(false);
  }, []);

  if (!mounted) return null;

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setMounted(false);
  };

  return (
    <div
      aria-hidden="true"
      className={`splash fixed inset-0 z-50 items-center justify-center overflow-hidden ${forced ? "splash-forced" : ""}`}
      style={{ background: SPLASH_GRADIENT, backgroundSize: "140% 140%" }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="splash-logo">
        <Check className="h-24 w-24 text-white drop-shadow-lg" strokeWidth={3} />
      </div>
    </div>
  );
}
