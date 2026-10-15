// src/hooks/useMatchReveal.ts

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import type { RevealData } from '@/api/client';
import { getCachedAvatarReveal, setCachedAvatarReveal } from '@/lib/avatarRevealCache';

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
  const [reveal, setReveal] = useState<RevealData | null>(() => {
    if (!matchId) return null;
    const cached = getCachedAvatarReveal(matchId);
    if (cached) {
      return {
        matchId,
        stage,
        stagePoints: cached.matchPoints,
        matchPoints: cached.matchPoints,
        avatarReveal: cached,
        partner: {
          alias: null,
          fullName: null,
          avatarUrl: cached.previewUrl,
          course: null,
          department: null,
          bio: null,
          socialHandles: null,
          isProfileUnlocked: cached.tier >= 5,
        },
      } as unknown as RevealData;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !reveal);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!matchId) {
      setReveal(null);
      setLoading(false);
      return;
    }
    const cached = getCachedAvatarReveal(matchId);
    if (!cached) {
      setLoading(true);
    }
    try {
      const data = await apiClient.getMatchReveal(matchId);
      setReveal(data);
      if (data?.avatarReveal) {
        setCachedAvatarReveal(matchId, data.avatarReveal);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load match details');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      const cached = getCachedAvatarReveal(matchId);
      if (cached) {
        setReveal((prev) => (prev?.avatarReveal ? prev : ({
          matchId,
          stage,
          stagePoints: cached.matchPoints,
          matchPoints: cached.matchPoints,
          avatarReveal: cached,
          partner: {
            alias: null,
            fullName: null,
            avatarUrl: cached.previewUrl,
            course: null,
            department: null,
            bio: null,
            socialHandles: null,
            isProfileUnlocked: cached.tier >= 5,
          },
        } as unknown as RevealData)));
      }
    }
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, stage]);

  return { reveal, loading, error, refetch };
}
