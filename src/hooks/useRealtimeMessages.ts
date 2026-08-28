// src/hooks/useRealtimeMessages.ts
//
// Previously polled every 5s. Now subscribes to conversation:message_new /
// conversation:typing over the shared socket connection (see lib/socket.ts)
// — used for every conversation regardless of variant, which is what let
// useMatchChat.ts (anonymous-only) go away. Falls back to a one-time
// refetch on socket reconnect to reconcile anything missed while
// disconnected, rather than continuous polling.

import { useEffect, useState, useRef, useCallback } from 'react';
import { isApiConfigured, ApiError } from '@/api/client';
import type { MessageRow } from '@/api/client';
import { Message, MessageReaction } from '../types/ally';
import { chatService, mapMessageRow } from '../lib/services/chatService';
import { getSocket } from '@/lib/socket';

const TEMP_ID_PREFIX = 'temp-';
const TYPING_IDLE_MS = 5000;

function reactionsEqual(a?: MessageReaction[], b?: MessageReaction[]): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  const sortKey = (items: MessageReaction[]) =>
    [...items].sort((x, y) => `${x.userId}:${x.emoji}`.localeCompare(`${y.userId}:${y.emoji}`));
  return JSON.stringify(sortKey(left)) === JSON.stringify(sortKey(right));
}

function mergeMessages(prev: Message[], next: Message[]): Message[] {
  const prevById = new Map(prev.map((m) => [m.id, m]));
  let anyChanged = next.length !== prev.length;

  const merged = next.map((incoming) => {
    const existing = prevById.get(incoming.id);
    if (!existing) {
      anyChanged = true;
      return incoming;
    }

    if (!reactionsEqual(existing.reactions, incoming.reactions)) {
      anyChanged = true;
      return { ...existing, reactions: incoming.reactions };
    }

    return existing;
  });

  return anyChanged ? merged : prev;
}

function applyReactionToggle(
  reactions: MessageReaction[] | undefined,
  userId: string,
  emoji: string,
): { reactions: MessageReaction[]; nextEmoji: string | null } {
  const current = reactions ?? [];
  const mine = current.find((reaction) => reaction.userId === userId);

  if (mine?.emoji === emoji) {
    return {
      reactions: current.filter((reaction) => reaction.userId !== userId),
      nextEmoji: null,
    };
  }

  const withoutMine = current.filter((reaction) => reaction.userId !== userId);
  return {
    reactions: [...withoutMine, { userId, emoji }],
    nextEmoji: emoji,
  };
}

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !isApiConfigured) return;

    const showSpinner = !silent && !hasLoadedOnceRef.current;
    if (showSpinner) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await chatService.getMessages(conversationId);
      setMessages((prev) => {
        const pending = prev.filter((m) => m.id.startsWith(TEMP_ID_PREFIX));
        const merged = mergeMessages(prev, data);
        return pending.length === 0 ? merged : [...merged, ...pending];
      });
      hasLoadedOnceRef.current = true;
    } catch (err: any) {
      if (!silent) {
        setError(err.message);
      }
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !isApiConfigured) {
      setMessages([]);
      hasLoadedOnceRef.current = false;
      return;
    }

    hasLoadedOnceRef.current = false;
    void loadMessages();
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const onMessageNew = (payload: { conversationId: string; message: MessageRow }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === payload.message.id) ? prev : [...prev, mapMessageRow(payload.message)],
      );
      setPartnerTyping(false);
    };
    const onTyping = (payload: { conversationId: string; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId) return;
      setPartnerTyping(payload.isTyping);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      if (payload.isTyping) {
        typingClearTimer.current = setTimeout(() => setPartnerTyping(false), TYPING_IDLE_MS);
      }
    };
    // Reconnect (e.g. after a dropped connection) can miss events —
    // reconcile once rather than polling continuously in the steady state.
    const onConnect = () => void loadMessages(true);

    socket.on('conversation:message_new', onMessageNew);
    socket.on('conversation:typing', onTyping);
    socket.on('connect', onConnect);
    return () => {
      socket.off('conversation:message_new', onMessageNew);
      socket.off('conversation:typing', onTyping);
      socket.off('connect', onConnect);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
    };
  }, [conversationId, loadMessages]);

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      getSocket()?.emit('conversation:typing', { conversationId, isTyping });
    },
    [conversationId],
  );

  const sendMessage = async (
    senderId: string,
    content: string | null,
    imageUrl?: string | null,
    replyTo?: Message['replyTo'] | null
  ) => {
    if (!conversationId) return;

    const tempId = `${TEMP_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const optimisticMessage: Message = {
      id: tempId,
      senderId,
      content,
      imageUrl: imageUrl ?? null,
      timestamp: now,
      createdAt: now,
      isRead: false,
      status: 'sending',
      replyTo: replyTo ?? null,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const saved = await chatService.sendMessage(
        conversationId,
        senderId,
        content,
        imageUrl,
        replyTo?.id ?? null
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? (saved ? { ...saved, status: 'sent' as const } : { ...m, status: 'sent' as const })
            : m
        )
      );
    } catch (err: any) {
      const isBlocked = err instanceof ApiError && err.status === 403;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const, blocked: isBlocked } : m))
      );
      setError(err.message);
      throw err;
    }
  };

  const retrySend = async (failedMessage: Message) => {
    if (!conversationId) return;
    const tempId = failedMessage.id;

    if (failedMessage.blocked) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' as const } : m))
    );

    try {
      const saved = await chatService.sendMessage(
        conversationId,
        failedMessage.senderId,
        failedMessage.content,
        failedMessage.imageUrl,
        failedMessage.replyTo?.id ?? null
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? (saved ? { ...saved } : { ...m, status: 'sent' as const })
            : m
        )
      );
    } catch (err: any) {
      const isBlocked = err instanceof ApiError && err.status === 403;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const, blocked: isBlocked } : m))
      );
      setError(err.message);
    }
  };

  const reactToMessage = useCallback(async (messageId: string, userId: string, emoji: string) => {
    if (!conversationId || messageId.startsWith(TEMP_ID_PREFIX)) return;

    let previousReactions: MessageReaction[] | undefined;
    let nextEmoji: string | null = emoji;

    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) return message;
        previousReactions = message.reactions;
        const updated = applyReactionToggle(message.reactions, userId, emoji);
        nextEmoji = updated.nextEmoji;
        return { ...message, reactions: updated.reactions };
      }),
    );

    try {
      const reactions = await chatService.setMessageReaction(conversationId, messageId, nextEmoji);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, reactions } : message,
        ),
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, reactions: previousReactions } : message,
        ),
      );
      setError(err.message);
    }
  }, [conversationId]);

  const deleteMessage = useCallback((messageId: string, mode: 'delete_for_me' | 'delete_for_everyone' = 'delete_for_me') => {
    // Optimistic update — apply immediately so the UI feels instant.
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        if (mode === 'delete_for_everyone') {
          return { ...m, isDeleted: true, content: 'This message was deleted', imageUrl: null, reactions: [] };
        } else {
          return { ...m, deletedForMe: true };
        }
      })
    );

    // Persist to backend in the background (only for real, non-temp messages).
    if (conversationId && isApiConfigured && !messageId.startsWith(TEMP_ID_PREFIX)) {
      import('@/api/client').then(({ apiClient }) => {
        apiClient.deleteMessage(conversationId, messageId, mode).catch((err: unknown) => {
          console.error('[deleteMessage] backend error:', err);
        });
      });
    }
  }, [conversationId]);

  return { messages, isLoading, error, partnerTyping, notifyTyping, sendMessage, retrySend, reactToMessage, deleteMessage };
}
