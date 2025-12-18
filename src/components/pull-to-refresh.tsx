"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { RefreshCw } from "lucide-react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
};

const PULL_THRESHOLD = 80; // Pixels to pull before triggering refresh
const RESISTANCE = 2.5; // How hard to pull (higher = more resistance)

export const PullToRefresh = ({ children, onRefresh, disabled, className = "" }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Only allow pull when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      startY.current = 0;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance - pulling gets harder the further you go
      const distance = Math.min(diff / RESISTANCE, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD / 2); // Keep showing indicator while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    startY.current = 0;
  };

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = isRefreshing ? 0 : progress * 180;
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={`relative flex-1 min-h-0 overflow-y-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-center transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div className={`rounded-full bg-theme-surface p-2 shadow-lg ring-1 ring-theme-border ${isRefreshing ? "animate-spin" : ""}`}>
          <RefreshCw 
            className="h-5 w-5 text-theme-primary transition-transform"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${isRefreshing ? 20 : pullDistance > 10 ? pullDistance / 3 : 0}px)` }}
      >
        {children}
      </div>
    </div>
  );
};
