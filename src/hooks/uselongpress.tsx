import { useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: (point: { x: number; y: number }) => void;
  delay?: number;
}

export type LongPressPoint = { x: number; y: number };

/**
 * Detects a touch-and-hold gesture. Fires onLongPress with the touch's
 * screen coordinates once held for `delay` ms. Any movement or early
 * release cancels it, so a normal scroll/tap never triggers it.
 */
export function useLongPress({ onLongPress, delay = 400 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startPointRef.current = { x: touch.clientX, y: touch.clientY };
      firedRef.current = false;

      timerRef.current = setTimeout(() => {
        if (startPointRef.current) {
          firedRef.current = true;
          onLongPress(startPointRef.current);
        }
      }, delay);
    },
    [delay, onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const start = startPointRef.current;
      if (!touch || !start) return;
      // Any meaningful finger movement cancels the hold — this is a scroll,
      // not a long-press.
      const dx = Math.abs(touch.clientX - start.x);
      const dy = Math.abs(touch.clientY - start.y);
      if (dx > 10 || dy > 10) clear();
    },
    [clear]
  );

  const handleTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
    didLongPress: () => firedRef.current,
  };
}