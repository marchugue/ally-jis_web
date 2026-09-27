import { useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: (point: { x: number; y: number }) => void;
  delay?: number;
}

export type LongPressPoint = { x: number; y: number };

/**
 * Detects a press-and-hold (touch or mouse) gesture.
 * Fires onLongPress with screen coordinates once held for `delay` ms.
 * Any movement or early release cancels it, so a normal scroll/click never triggers it.
 */
export function useLongPress({ onLongPress, delay = 350 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (x: number, y: number) => {
      startPointRef.current = { x, y };
      firedRef.current = false;
      clear();

      timerRef.current = setTimeout(() => {
        if (startPointRef.current) {
          firedRef.current = true;
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(40);
            }
          } catch {}
          onLongPressRef.current(startPointRef.current);
        }
      }, delay);
    },
    [clear, delay]
  );

  const moveHold = useCallback(
    (x: number, y: number) => {
      const start = startPointRef.current;
      if (!start) return;
      const dx = Math.abs(x - start.x);
      const dy = Math.abs(y - start.y);
      if (dx > 10 || dy > 10) {
        clear();
      }
    },
    [clear]
  );

  const endHold = useCallback(() => {
    clear();
  }, [clear]);

  // Touch event handlers (mobile)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startHold(touch.clientX, touch.clientY);
    },
    [startHold]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      moveHold(touch.clientX, touch.clientY);
    },
    [moveHold]
  );

  // Mouse event handlers (desktop / browser emulation)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only primary button
      startHold(e.clientX, e.clientY);
    },
    [startHold]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      moveHold(e.clientX, e.clientY);
    },
    [moveHold]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: endHold,
    onTouchCancel: endHold,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: endHold,
    onMouseLeave: endHold,
    didLongPress: () => {
      const did = firedRef.current;
      if (did) {
        setTimeout(() => {
          firedRef.current = false;
        }, 120);
      }
      return did;
    },
  };
}