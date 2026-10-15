// src/components/feed/PullToRefresh.tsx
//
// Cross-platform pull-to-refresh component for both Web and Mobile.
// Supports mobile touch pull-down and desktop scroll-up / wheel gestures at scrollTop === 0.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: React.ReactNode;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const PULL_THRESHOLD = 60; // px required to trigger refresh
const MAX_PULL = 90; // maximum pull distance with resistance

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing,
  children,
  className,
  scrollContainerRef,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to determine if the container is scrolled to the very top
  const isAtTop = useCallback(() => {
    const scroller = scrollContainerRef?.current || containerRef.current?.closest('.overflow-y-auto') || window;
    if (scroller === window) {
      return window.scrollY <= 0;
    }
    return (scroller as HTMLElement).scrollTop <= 0;
  }, [scrollContainerRef]);

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (isAtTop()) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && isAtTop()) {
      // Logarithmic rubber-band resistance
      const distance = Math.min(diff * 0.45, MAX_PULL);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshing) {
      setPullDistance(50); // Keep indicator visible during refresh
      try {
        await onRefresh();
      } finally {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  };

  // Desktop wheel gesture: scroll up when already at the top
  useEffect(() => {
    let wheelAccumulator = 0;
    let wheelTimer: any = null;

    const handleWheel = (e: WheelEvent) => {
      if (isRefreshing) return;
      if (isAtTop() && e.deltaY < -15) {
        wheelAccumulator += Math.abs(e.deltaY) * 0.35;
        const dist = Math.min(wheelAccumulator, MAX_PULL);
        setPullDistance(dist);
        pullDistanceRef.current = dist;

        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(async () => {
          if (pullDistanceRef.current >= PULL_THRESHOLD) {
            setPullDistance(50);
            try {
              await onRefresh();
            } finally {
              setPullDistance(0);
              pullDistanceRef.current = 0;
              wheelAccumulator = 0;
            }
          } else {
            setPullDistance(0);
            pullDistanceRef.current = 0;
            wheelAccumulator = 0;
          }
        }, 120);
      }
    };

    const target = scrollContainerRef?.current || containerRef.current;
    if (target) {
      target.addEventListener('wheel', handleWheel, { passive: true });
    }
    return () => {
      if (target) {
        target.removeEventListener('wheel', handleWheel);
      }
      clearTimeout(wheelTimer);
    };
  }, [isAtTop, onRefresh, isRefreshing, scrollContainerRef]);

  const hasTriggered = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn('relative w-full', className)}
    >
      {/* ── Top Pull-to-Refresh Indicator ── */}
      <div
        className={cn(
          'w-full flex items-center justify-center overflow-hidden pointer-events-none transition-all duration-200',
          !isPulling && !isRefreshing && 'transition-all duration-300'
        )}
        style={{
          height: isRefreshing ? '50px' : `${pullDistance}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm border border-gray-200/80 dark:border-white/10 text-[#1A6B3C] dark:text-emerald-400">
          {isRefreshing ? (
            <>
              <RefreshCw size={15} className="animate-spin text-[#1A6B3C] dark:text-emerald-400" />
              <span className="font-jakarta text-xs font-semibold">Updating feed...</span>
            </>
          ) : (
            <>
              <ArrowDown
                size={15}
                className={cn(
                  'transition-transform duration-200 text-[#1A6B3C] dark:text-emerald-400',
                  hasTriggered && 'rotate-180'
                )}
              />
              <span className="font-jakarta text-xs font-semibold">
                {hasTriggered ? 'Release to refresh' : 'Pull down to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default PullToRefresh;
