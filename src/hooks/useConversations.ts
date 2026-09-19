import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Conversation } from '../types/ally';
import { chatService } from '../lib/services/chatService';
import { profileService } from '../lib/services/profileService';
import { getSocket } from '@/lib/socket';

const POLL_INTERVAL_MS = 15000;

// Fields that, if changed, mean the row needs a new object reference.
// Anything not listed here being different won't trigger a row re-render.
function rowChanged(a: Conversation, b: Conversation): boolean {
  return (
    a.lastMessage !== b.lastMessage ||
    a.lastMessageTime !== b.lastMessageTime ||
    a.lastMessageSenderId !== b.lastMessageSenderId ||
    a.unreadCount !== b.unreadCount ||
    a.participantName !== b.participantName ||
    a.participantAvatar !== b.participantAvatar ||
    a.blockStatus !== b.blockStatus ||
    a.icebreakersEnabled !== b.icebreakersEnabled ||
    a.dayStreak !== b.dayStreak ||
    a.streakActiveToday !== b.streakActiveToday ||
    a.matchInfo?.dayStreak !== b.matchInfo?.dayStreak ||
    a.matchInfo?.streakActiveToday !== b.matchInfo?.streakActiveToday
  );
}

/**
 * Merges freshly-fetched conversations into the previous list while preserving
 * object identity for any row that hasn't actually changed. This lets
 * React.memo'd row components bail out of re-rendering individually instead
 * of the whole list re-rendering on every poll/refresh.
 */
function mergeConversations(prev: Conversation[], next: Conversation[]): Conversation[] {
  const prevById = new Map(prev.map((c) => [c.id, c]));
  let anyChanged = next.length !== prev.length;

  const merged = next.map((incoming) => {
    const existing = prevById.get(incoming.id);
    if (existing && !rowChanged(existing, incoming)) {
      return existing; // same reference, row skips re-render
    }
    anyChanged = true;
    return incoming;
  });

  // If nothing actually changed, return the *same* array reference too,
  // so the list container itself doesn't think it has new data.
  return anyChanged ? merged : prev;
}

const CACHE_KEY_PREFIX = 'ally_conversations_cache_';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedConversationsData {
  conversations: Conversation[];
  hasMore: boolean;
  nextCursor: string | null;
  cachedAt: number;
}

function getCachedConversations(userId: string): CachedConversationsData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.conversations)) {
      const cachedAt = Number(parsed.cachedAt) || 0;
      if (Date.now() - cachedAt > MAX_CACHE_AGE_MS) {
        localStorage.removeItem(CACHE_KEY_PREFIX + userId);
        return null;
      }
      return {
        conversations: parsed.conversations,
        hasMore: Boolean(parsed.hasMore),
        nextCursor: parsed.nextCursor ?? null,
        cachedAt,
      };
    }
  } catch {
    // ignore corrupted cache
  }
  return null;
}

function setCachedConversations(
  userId: string,
  conversations: Conversation[],
  hasMore: boolean,
  nextCursor: string | null
) {
  try {
    // Only cache up to 30 conversations to keep localStorage lean
    const toCache = conversations.slice(0, 30);
    localStorage.setItem(
      CACHE_KEY_PREFIX + userId,
      JSON.stringify({
        conversations: toCache,
        hasMore,
        nextCursor,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota errors
  }
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (!userId) return [];
    const cached = getCachedConversations(userId);
    return cached?.conversations ?? [];
  });
  const [hasMore, setHasMore] = useState(() => {
    if (!userId) return false;
    const cached = getCachedConversations(userId);
    return cached?.hasMore ?? false;
  });
  const [nextCursor, setNextCursor] = useState<string | null>(() => {
    if (!userId) return null;
    const cached = getCachedConversations(userId);
    return cached?.nextCursor ?? null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!userId) return false;
    const cached = getCachedConversations(userId);
    return !cached || cached.conversations.length === 0;
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const nextCursorRef = useRef<string | null>(nextCursor);
  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!userId || !isApiConfigured) return;

    // Only show the skeleton if we don't have any cached or existing data.
    const showSkeleton = !silent && !hasLoadedOnceRef.current && conversations.length === 0;
    if (showSkeleton) {
      setIsLoading(true);
    }
    setError(null);

    try {
      let interests: string[] = [];
      try {
        const profile = await profileService.getMyProfile();
        interests = profile.interests;
      } catch {
        // profile fetch is optional for conversation list
      }

      const result = await chatService.getConversations(userId, interests, { limit: 20 });

      const deduped = new Map<string, Conversation>();
      result.conversations.forEach((conv) => {
        if (!deduped.has(conv.participantId)) {
          deduped.set(conv.participantId, conv);
        }
      });
      const fresh = Array.from(deduped.values());

      setConversations((prev) => {
        const merged = mergeConversations(prev, fresh);
        setCachedConversations(userId, merged, result.hasMore, result.nextCursor);
        return merged;
      });
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      hasLoadedOnceRef.current = true;
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }, [userId, conversations.length]);

  const loadMore = useCallback(async () => {
    if (!userId || !nextCursorRef.current || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      let interests: string[] = [];
      try {
        const profile = await profileService.getMyProfile();
        interests = profile.interests;
      } catch {}

      const result = await chatService.getConversations(userId, interests, {
        limit: 20,
        cursor: nextCursorRef.current,
      });

      setConversations((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newRows = result.conversations.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newRows];
      });
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err: any) {
      console.warn('[useConversations.loadMore] error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, hasMore, isLoadingMore]);

  // ── Initial load + Window focus revalidation + Slow safety net ───────────
  useEffect(() => {
    if (!isApiConfigured || !userId) return;

    // Check if we have cached conversations for instant 0ms display
    const cached = getCachedConversations(userId);
    if (cached && cached.conversations.length > 0) {
      setConversations(cached.conversations);
      setHasMore(cached.hasMore);
      setNextCursor(cached.nextCursor);
      setIsLoading(false);
      hasLoadedOnceRef.current = true;
      // Background silent revalidation
      void loadConversations(true);
    } else {
      void loadConversations(false);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadConversations(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    // Passive low-frequency fallback (60s instead of 15s) only when page is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadConversations(true);
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
      clearInterval(interval);
    };
  }, [userId, loadConversations]);

  // ── Real-time new-message updates ─────────────────────────────────────────
  // Listen for 'conversation:message_new' so the conversation list preview
  // (last message, ordering, unread count) refreshes instantly when a message
  // arrives from any device — no need to wait for the next 15-second poll.
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const onMessageNew = () => {
      void loadConversations(true);
    };
    // Also refresh on reconnect to pick up anything missed while disconnected.
    const onConnect = () => void loadConversations(true);

    socket.on('conversation:message_new', onMessageNew);
    socket.on('connect', onConnect);
    return () => {
      socket.off('conversation:message_new', onMessageNew);
      socket.off('connect', onConnect);
    };
  }, [userId, loadConversations]);

  // ── Real-time streak updates ─────────────────────────────────────────────
  // Listen for 'conversation:streak_updated' and 'matchmaking:streak_update'
  // so the badge reflects a new streak day and active status instantly.
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const onStreakUpdated = (payload: {
      conversationId?: string;
      matchId?: string;
      dayStreak?: number;
      streak?: number;
      streakActiveToday?: boolean;
      status?: string;
    }) => {
      setConversations((prev) =>
        prev.map((c) => {
          const isMatch =
            (payload.conversationId && c.id === payload.conversationId) ||
            (payload.matchId && c.matchInfo?.matchId === payload.matchId);
          if (!isMatch) return c;
          const isInactive = payload.status === 'inactive' || payload.dayStreak === 0 || payload.streak === 0;
          const streak = isInactive ? 0 : (payload.dayStreak ?? payload.streak ?? c.dayStreak);
          const activeToday = isInactive ? false : (payload.streakActiveToday ?? true);
          return {
            ...c,
            dayStreak: streak,
            streakActiveToday: activeToday,
            matchInfo: c.matchInfo
              ? {
                  ...c.matchInfo,
                  dayStreak: streak,
                  streakActiveToday: activeToday,
                }
              : c.matchInfo,
          };
        }),
      );
    };

    socket.on('conversation:streak_updated', onStreakUpdated);
    socket.on('matchmaking:streak_update', onStreakUpdated);
    return () => {
      socket.off('conversation:streak_updated', onStreakUpdated);
      socket.off('matchmaking:streak_update', onStreakUpdated);
    };
  }, [userId]);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== conversationId);
      if (userId) {
        setCachedConversations(userId, updated, hasMore, nextCursorRef.current);
      }
      return updated;
    });
  }, [userId, hasMore]);

  return {
    conversations,
    hasMore,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    refresh: loadConversations,
    loadMore,
    removeConversation,
  };
}