import { useEffect, useState } from 'react';

/**
 * Returns the bottom inset caused by the on-screen keyboard on mobile browsers.
 * Uses visualViewport so the chat body can lift while the conversation header
 * stays pinned at the top.
 */
export function useKeyboardInset(enabled: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setKeyboardInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return keyboardInset;
}
