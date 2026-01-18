"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && containerRef.current?.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      }
    },
    [pulling, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);

      // Refresh the page data
      router.refresh();

      // Wait a bit for the refresh to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRefreshing(false);
    }

    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, refreshing, router]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200 overflow-hidden",
          refreshing && "pb-2"
        )}
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            refreshing && "animate-spin",
            pullDistance >= threshold && !refreshing && "text-primary"
          )}
          style={{
            transform: `rotate(${(pullDistance / threshold) * 180}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
