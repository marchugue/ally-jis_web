import { useEffect, useRef, useState } from 'react';

/**
 * Returns the height (px) currently occupied by the on-screen keyboard on
 * mobile browsers so the chat body can be pushed up.
 *
 * Strategy:
 *  • Android Chrome 108+ respects `interactive-widget=resizes-content`, which
 *    shrinks `window.innerHeight` when the keyboard opens, so `100dvh` already
 *    = visible area and we need NO inset.  We detect this by checking whether
 *    the visual viewport height ≈ window.innerHeight.
 *  • iOS Safari (and older Chrome) keep `window.innerHeight` at the full
 *    screen height even with the keyboard open.  We compare
 *    `visualViewport.height` against the cached "resting" height to derive the
 *    inset.
 *
 * @param enabled  Only subscribe while a chat is open on a narrow screen.
 */
export function useKeyboardInset(enabled: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  // Remember the viewport height before the keyboard appeared.
  const restingHeightRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setKeyboardInset(0);
      restingHeightRef.current = null;
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    // Capture resting height once (before keyboard might be open).
    if (restingHeightRef.current === null) {
      restingHeightRef.current = viewport.height;
    }

    const update = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // If window.innerHeight already shrank (interactive-widget=resizes-content),
        // the layout has already adapted — no manual inset needed.
        const layoutShrank = Math.abs(window.innerHeight - viewport.height) < 30;
        if (layoutShrank) {
          setKeyboardInset(0);
          return;
        }

        // iOS Safari / older Chrome: derive keyboard height from the resting
        // viewport height we captured before the keyboard appeared.
        const resting = restingHeightRef.current ?? viewport.height;
        const inset = Math.max(0, resting - viewport.height - viewport.offsetTop);
        // Ignore tiny fluctuations (browser chrome bouncing, etc.)
        setKeyboardInset(inset > 50 ? inset : 0);
      });
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // Reset resting height when enabled changes (e.g. user navigates away).
  useEffect(() => {
    if (!enabled) {
      restingHeightRef.current = null;
      setKeyboardInset(0);
    }
  }, [enabled]);

  return keyboardInset;
}
