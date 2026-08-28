// src/hooks/useMatchReveal.ts

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import type { RevealData } from '@/api/client';

export interface UseMatchRevealResult {
  reveal: RevealData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * `stage` is passed in (from useMatchmaking, itself updated by the
 * matchmaking:stage_updated socket event) purely as a dependency trigger
 * — refetches whenever it changes so newly-unlocked fields show up
 * without the user needing to do anything.
 */
export function useMatchReveal(matchId: string | null, stage: number): UseMatchRevealResult {
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!matchId) {
      setReveal(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.getMatchReveal(matchId);
      setReveal(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load match details');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, stage]);

  return { reveal, loading, error, refetch };
}
