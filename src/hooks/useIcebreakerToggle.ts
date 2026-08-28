// src/hooks/useIcebreakerToggle.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/lib/services/chatService';

export function useIcebreakerToggle(conversationId: string | undefined) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    chatService.getIcebreakersEnabled(conversationId)
      .then((value) => {
        if (requestIdRef.current !== requestId) return;
        setEnabled(value ?? true);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        console.error('Failed to fetch icebreaker preference:', err);
        setError(true);
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }, [conversationId]);

  const toggle = useCallback(async (next: boolean) => {
    if (!conversationId) return;
    const previous = enabled;
    setEnabled(next);
    setError(false);
    try {
      await chatService.setIcebreakersEnabled(conversationId, next);
    } catch (err) {
      console.error('Failed to update icebreaker preference:', err);
      setEnabled(previous);
      setError(true);
    }
  }, [conversationId, enabled]);

  return { enabled, loading, error, toggle };
}