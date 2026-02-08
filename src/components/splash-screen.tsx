"use client";

import { useEffect, useState, useCallback } from "react";
import { Check } from "lucide-react";

type Props = {
  onComplete: () => void;
};

// Logo colors
const GRADIENT = {
  topLeft: "#4ade80", // Grün
  topRight: "#ec4899", // Pink
  bottomLeft: "#fbbf24", // Gelb
  bottomRight: "#818cf8", // Lila
  base: "#f97316", // Orange
};

export function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"bounce" | "fade-out" | "done">("bounce");
  const [isPWA, setIsPWA] = useState(false);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Check if running as PWA (standalone mode)
  useEffect(() => {
    // Dev mode: ?splash=1 in URL
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.get("splash") === "1";

    const isStandalone =
      forceShow ||
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari standalone check
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone: boolean }).standalone);

    setIsPWA(isStandalone);

    // If not PWA, skip splash immediately
    if (!isStandalone) {
      setPhase("done");
      handleComplete();
    }
  }, [handleComplete]);

  // Animation timeline (only runs in PWA)
  useEffect(() => {
    if (!isPWA) return;

    const timers: NodeJS.Timeout[] = [];

    // After bounce animation, quick exit
    timers.push(
      setTimeout(() => {
        setPhase("fade-out");
      }, 800)
    );

    // Remove splash after transition
    timers.push(
      setTimeout(() => {
        setPhase("done");
        handleComplete();
      }, 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [isPWA, handleComplete]);

  if (phase === "done") return null;

  // Base gradient
  const baseGradient = `linear-gradient(
    165deg,
    ${GRADIENT.topLeft} 0%,
    ${GRADIENT.bottomLeft} 20%,
    ${GRADIENT.base} 40%,
    ${GRADIENT.topRight} 60%,
    ${GRADIENT.bottomRight} 80%
  )`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-200 ease-out ${
        phase === "fade-out" ? "scale-105 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      {/* Animated gradient with wave movement */}
      <div
        className="absolute inset-0 animate-[wave_2s_ease-in-out_infinite]"
        style={{
          background: baseGradient,
          backgroundSize: "140% 140%",
        }}
      />

      {/* Logo */}
      <div
        className={`relative z-10 ${
          phase === "bounce" ? "animate-[bounce-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]" : ""
        }`}
      >
        <Check className="h-24 w-24 text-white drop-shadow-lg" strokeWidth={3} />
      </div>
    </div>
  );
}
