import { useEffect, useRef, useState } from 'react';

/**
 * Returns the height (px) currently occupied by the on-screen virtual keyboard
 * on mobile browsers so the chat body and input can push up smoothly,
 * exactly matching the native mobile app's KeyboardHugView.
 *
 * Strategy:
 *  • Tracks window.visualViewport height and offsetTop.
 *  • Robust across iOS Safari (where window.innerHeight never changes) and
 *    Android Chrome (where interactive-widget or layout resizing may occur).
 *  • Prevents iOS Safari from auto-scrolling the whole page and displacing the
 *    sticky/fixed header when an input is focused.
 *  • Ignores minor fluctuations (< 60px) caused by browser chrome/address bar
 *    transitions so we only respond to actual virtual keyboard activity.
 *
 * @param enabled  Only subscribe while a chat is open on a mobile screen.
 */
export function useKeyboardInset(enabled: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);
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

    // Lock page-level scrolling so iOS Safari doesn't scroll the window
    // and push the header out of view.
    const originalDocOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    // Capture resting (non-keyboard) height when no input is focused
    const updateRestingHeight = () => {
      const activeEl = document.activeElement;
      const isInputFocused = Boolean(
        activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            (activeEl as HTMLElement).isContentEditable)
      );

      if (!isInputFocused) {
        restingHeightRef.current = Math.max(window.innerHeight, viewport.height);
      }
    };

    updateRestingHeight();

    const handleViewportChange = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Prevent window scroll on iOS Safari
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        const activeEl = document.activeElement;
        const isInputFocused = Boolean(
          activeEl &&
            (activeEl.tagName === 'INPUT' ||
              activeEl.tagName === 'TEXTAREA' ||
              (activeEl as HTMLElement).isContentEditable)
        );

        // Reference height when keyboard is closed
        const resting = restingHeightRef.current ?? Math.max(window.innerHeight, viewport.height);

        // Visible height right now
        const currentVisibleHeight = viewport.height;
        const offsetTop = viewport.offsetTop || 0;

        // Difference between resting viewport and current visible viewport
        const diff = Math.max(0, resting - currentVisibleHeight - offsetTop);

        // Virtual keyboards on mobile are virtually always >= 120px tall.
        // Address bars are typically 30-50px.
        if (isInputFocused || diff > 80) {
          setKeyboardInset(diff > 40 ? Math.round(diff) : 0);
        } else {
          // Update resting height if no input is focused and screen is idle
          restingHeightRef.current = Math.max(window.innerHeight, viewport.height);
          setKeyboardInset(0);
        }
      });
    };

    const handleFocus = () => {
      // Keep page pinned to top
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      handleViewportChange();
    };

    const handleBlur = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        const stillFocused = Boolean(
          activeEl &&
            (activeEl.tagName === 'INPUT' ||
              activeEl.tagName === 'TEXTAREA' ||
              (activeEl as HTMLElement).isContentEditable)
        );
        if (!stillFocused) {
          updateRestingHeight();
          handleViewportChange();
        }
      }, 100);
    };

    const handleOrientationChange = () => {
      restingHeightRef.current = null;
      setTimeout(() => {
        updateRestingHeight();
        handleViewportChange();
      }, 150);
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    window.addEventListener('orientationchange', handleOrientationChange);

    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      // Restore document overflows
      document.documentElement.style.overflow = originalDocOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [enabled]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      restingHeightRef.current = null;
      setKeyboardInset(0);
    }
  }, [enabled]);

  return keyboardInset;
}
