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
    a.dayStreak !== b.dayStreak
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

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const loadConversations = useCallback(async (silent = false) => {
    if (!userId || !isApiConfigured) return;

    // Only ever show the skeleton on the very first load. Every poll or
    // refresh after that is silent by default — old data stays on screen
    // until the new data is ready, then we swap in just what changed.
    const showSkeleton = !silent && !hasLoadedOnceRef.current;
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

      const mapped = await chatService.getConversations(userId, interests);

      const deduped = new Map<string, Conversation>();
      mapped.forEach((conv) => {
        if (!deduped.has(conv.participantId)) {
          deduped.set(conv.participantId, conv);
        }
      });
      const fresh = Array.from(deduped.values());

      setConversations((prev) => mergeConversations(prev, fresh));
      hasLoadedOnceRef.current = true;
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!isApiConfigured || !userId) return;

    void loadConversations();
    const interval = setInterval(() => {
      void loadConversations(true); // polls are always silent now
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
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
  // Listen for 'conversation:streak_updated' so the badge reflects a new
  // streak day instantly — no need to wait for the next 15-second poll.
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const onStreakUpdated = (payload: { conversationId: string; dayStreak: number }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? { ...c, dayStreak: payload.dayStreak }
            : c,
        ),
      );
    };

    socket.on('conversation:streak_updated', onStreakUpdated);
    return () => {
      socket.off('conversation:streak_updated', onStreakUpdated);
    };
  }, [userId]);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  return { conversations, isLoading, error, refresh: loadConversations, removeConversation };
}