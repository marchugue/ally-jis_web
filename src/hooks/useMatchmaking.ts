// src/hooks/useMatchmaking.ts
//
// Manages the match lifecycle for ONE or MORE simultaneous anonymous matches.
//
// Key design decisions:
//   - A user can have multiple "chatting"/"confirmed" matches at once.
//   - Only ONE match can be "pending" (awaiting accept/decline) at a time
//     (the backend still enforces this).
//   - The queue can be joined again even while existing matches are active.
//   - `activeMatches` is the full list; `pendingMatch` is the one that needs
//     an accept/decline decision right now.

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/api/client';
import type { MatchIdentityView, MatchRow, QueueRow } from '@/api/client';
import { getSocket } from '@/lib/socket';

export type MatchPhase =
  | 'idle'       // no queue, no matches
  | 'searching'  // in queue, no active match yet
  | 'pending'    // a match is waiting for accept/decline
  | 'chatting'   // ≥1 match in chatting state (may also be searching for more)
  | 'confirmed'  // ≥1 match confirmed
  | 'ended';     // most-recent match ended (transient banner state)

export interface EndedInfo {
  reason: string;
  by: 'you' | 'partner' | 'timeout';
}

export interface UseMatchmakingResult {
  /** Computed overall phase (for backward-compatible UI logic) */
  phase: MatchPhase;
  loading: boolean;
  error: string | null;
  /** The hook now syncs dailyMatchCount from the server on load and after
   * joinQueue() completes — localStorage is used only for optimistic display
   * before the first fetch resolves. */
  dailyMatchCount: number;
  /** The match currently waiting for accept/decline */
  pendingMatch: MatchRow | null;
  /** Single active match — kept for backward compat with existing UI */
  activeMatch: MatchRow | null;
  /** All active matches (chatting + confirmed + pending) */
  activeMatches: MatchRow[];
  identity: MatchIdentityView | null;
  streak: number;
  compatibilityScore: number | null;
  acceptDeadline: number | null;
  ended: EndedInfo | null;
  justUnlockedStage: number | null;
  /** True whenever the user has an active queue entry — use this instead of
   * phase === 'searching' to drive search UI, because phase priority can hide
   * 'searching' when older chatting/confirmed matches already exist. */
  isInQueue: boolean;
  dismissStageUnlock: () => void;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  endMatch: (matchId?: string) => Promise<void>;
  dismissEnded: () => void;
}

export function useMatchmaking(): UseMatchmakingResult {
  const [queueEntry, setQueueEntry] = useState<QueueRow | null>(null);
  const [activeMatches, setActiveMatches] = useState<MatchRow[]>([]);
  const [identity, setIdentity] = useState<MatchIdentityView | null>(null);
  const [streak, setStreak] = useState(0);
  const [ended, setEnded] = useState<EndedInfo | null>(null);
  const [justUnlockedStage, setJustUnlockedStage] = useState<number | null>(null);
  const [dailyMatchCount, setDailyMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await apiClient.getMatchmakingStatus();

      // Prefer the new `activeMatches` array; fall back to wrapping the legacy
      // `activeMatch` in a single-element array so old backends still work.
      const matches: MatchRow[] = status.activeMatches
        ? status.activeMatches
        : status.activeMatch
          ? [status.activeMatch]
          : [];

      setQueueEntry(status.queueEntry);
      setActiveMatches(matches);
      setIdentity(status.identity);
      if (status.dailyMatchCount !== undefined) setDailyMatchCount(status.dailyMatchCount);

      // Streak from the most-recent active match
      const newest = matches[0];
      if (newest) setStreak(newest.streak_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load matchmaking status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onLifecycleEvent = () => void refreshStatus();
    const onStreakUpdate = (payload: { streak: number }) => setStreak(payload.streak);
    const onStageUpdated = (payload: { stage: number; dayStreak: number; matchId?: string }) => {
      setActiveMatches((prev) =>
        prev.map((m) =>
          !payload.matchId || m.id === payload.matchId
            ? { ...m, current_stage: payload.stage, day_streak: payload.dayStreak }
            : m
        )
      );
      setJustUnlockedStage(payload.stage);
    };
    const onPartnerDeclined = () => {
      setEnded({ reason: 'Your match declined the chat.', by: 'partner' });
      void refreshStatus();
    };
    const onMatchTimedOut = () => {
      setEnded({ reason: 'Nobody accepted in time.', by: 'timeout' });
      void refreshStatus();
    };
    const onChatExpired = () => {
      setEnded({ reason: 'The chat expired before either of you said hello.', by: 'timeout' });
      void refreshStatus();
    };
    const onMatchEnded = () => {
      setEnded({ reason: 'Your match ended the chat.', by: 'partner' });
      void refreshStatus();
    };

    socket.on('matchmaking:match_found', onLifecycleEvent);
    socket.on('matchmaking:room_ready', onLifecycleEvent);
    socket.on('matchmaking:partner_accepted', onLifecycleEvent);
    socket.on('matchmaking:match_confirmed', onLifecycleEvent);
    socket.on('matchmaking:streak_update', onStreakUpdate);
    socket.on('matchmaking:stage_updated', onStageUpdated);
    socket.on('matchmaking:partner_declined', onPartnerDeclined);
    socket.on('matchmaking:match_timed_out', onMatchTimedOut);
    socket.on('matchmaking:chat_expired', onChatExpired);
    socket.on('matchmaking:match_ended', onMatchEnded);

    return () => {
      socket.off('matchmaking:match_found', onLifecycleEvent);
      socket.off('matchmaking:room_ready', onLifecycleEvent);
      socket.off('matchmaking:partner_accepted', onLifecycleEvent);
      socket.off('matchmaking:match_confirmed', onLifecycleEvent);
      socket.off('matchmaking:streak_update', onStreakUpdate);
      socket.off('matchmaking:stage_updated', onStageUpdated);
      socket.off('matchmaking:partner_declined', onPartnerDeclined);
      socket.off('matchmaking:match_timed_out', onMatchTimedOut);
      socket.off('matchmaking:chat_expired', onChatExpired);
      socket.off('matchmaking:match_ended', onMatchEnded);
    };
  }, [refreshStatus]);

  const joinQueue = useCallback(async () => {
    setError(null);
    try {
      const entry = await apiClient.joinMatchQueue();
      setQueueEntry(entry);
    } catch (err) {
      // Refresh status even on error — a pre-existing pending match should
      // still open the overlay (e.g. if the server returned a non-fatal error).
      void refreshStatus();
      setError(err instanceof Error ? err.message : 'Could not join the queue');
    }
  }, [refreshStatus]);

  const leaveQueue = useCallback(async () => {
    setError(null);
    try {
      await apiClient.leaveMatchQueue();
      setQueueEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave the queue');
    }
  }, []);

  // The match currently waiting for accept/decline (only one at a time from backend)
  const pendingMatch = activeMatches.find((m) => m.status === 'pending') ?? null;

  const accept = useCallback(async () => {
    if (!pendingMatch) return;
    setError(null);
    try {
      const result = await apiClient.acceptMatch(pendingMatch.id);
      setActiveMatches((prev) =>
        prev.map((m) => (m.id === pendingMatch.id ? result : m))
      );
      setIdentity(result.identity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the match');
    }
  }, [pendingMatch]);

  const decline = useCallback(async () => {
    if (!pendingMatch) return;
    setError(null);
    try {
      await apiClient.declineMatch(pendingMatch.id);
      setEnded({ reason: "You declined. That's okay — try again whenever.", by: 'you' });
      setActiveMatches((prev) => prev.filter((m) => m.id !== pendingMatch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline the match');
    }
  }, [pendingMatch]);

  // endMatch accepts an optional matchId so callers can end a specific match
  // from a list. Falls back to the first chatting match for backward compat.
  const endMatch = useCallback(
    async (matchId?: string) => {
      const target =
        matchId
          ? activeMatches.find((m) => m.id === matchId)
          : activeMatches.find((m) => m.status === 'chatting' || m.status === 'confirmed');

      if (!target) return;
      setError(null);
      try {
        await apiClient.endMatch(target.id);
        setEnded({ reason: 'You ended the chat.', by: 'you' });
        setActiveMatches((prev) => prev.filter((m) => m.id !== target.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not end the match');
      }
    },
    [activeMatches]
  );

  const dismissEnded = useCallback(() => {
    setEnded(null);
    void refreshStatus();
  }, [refreshStatus]);

  const dismissStageUnlock = useCallback(() => setJustUnlockedStage(null), []);

  // ── Phase derivation ──────────────────────────────────────────────────────
  // Priority: ended > pending > chatting > confirmed > searching > idle
  const phase: MatchPhase = ended
    ? 'ended'
    : pendingMatch
      ? 'pending'
      : activeMatches.some((m) => m.status === 'chatting')
        ? 'chatting'
        : activeMatches.some((m) => m.status === 'confirmed')
          ? 'confirmed'
          : queueEntry
            ? 'searching'
            : 'idle';

  // Backward-compat: expose the "most relevant" single match
  const activeMatch =
    pendingMatch ??
    activeMatches.find((m) => m.status === 'chatting') ??
    activeMatches.find((m) => m.status === 'confirmed') ??
    null;

  return {
    phase,
    loading,
    error,
    dailyMatchCount,
    pendingMatch,
    activeMatch,
    activeMatches,
    identity,
    streak,
    compatibilityScore: activeMatch?.compatibility_score ?? null,
    acceptDeadline: pendingMatch?.accept_expires_at
      ? new Date(pendingMatch.accept_expires_at).getTime()
      : null,
    ended,
    justUnlockedStage,
    dismissStageUnlock,
    isInQueue: !!queueEntry,
    joinQueue,
    leaveQueue,
    accept,
    decline,
    endMatch,
    dismissEnded,
  };
}
