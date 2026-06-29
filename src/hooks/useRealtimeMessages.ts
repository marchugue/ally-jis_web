import { useEffect, useState, useRef, useCallback } from 'react';
import { isApiConfigured } from '@/api/client';
import { Message } from '../types/ally';
import { chatService } from '../lib/services/chatService';

const POLL_INTERVAL_MS = 5000;
const TEMP_ID_PREFIX = 'temp-';

function mergeMessages(prev: Message[], next: Message[]): Message[] {
  const prevById = new Map(prev.map((m) => [m.id, m]));
  let anyChanged = next.length !== prev.length;

  const merged = next.map((incoming) => {
    const existing = prevById.get(incoming.id);
    if (existing) {
      return existing;
    }
    anyChanged = true;
    return incoming;
  });

  return anyChanged ? merged : prev;
}

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !isApiConfigured) return;

    const showSpinner = !silent && !hasLoadedOnceRef.current;
    if (showSpinner) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await chatService.getMessages(conversationId);
      const lastId = data[data.length - 1]?.id ?? null;

      if (lastId !== lastMessageIdRef.current || !silent) {
        lastMessageIdRef.current = lastId;
        setMessages((prev) => {
          const pending = prev.filter((m) => m.id.startsWith(TEMP_ID_PREFIX));
          const merged = mergeMessages(prev, data);
          if (pending.length === 0) return merged;
          return [...merged, ...pending];
        });
      }
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
    const interval = setInterval(() => {
      void loadMessages(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId, loadMessages]);

  const sendMessage = async (senderId: string, content: string | null, imageUrl?: string | null) => {
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
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const saved = await chatService.sendMessage(conversationId, senderId, content, imageUrl);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? (saved ? { ...saved } : { ...m, status: 'sent' as const })
            : m
        )
      );

      void loadMessages(true);
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m))
      );
      setError(err.message);
      throw err;
    }
  };

  const retrySend = async (failedMessage: Message) => {
    if (!conversationId) return;
    const tempId = failedMessage.id;

    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' as const } : m))
    );

    try {
      const saved = await chatService.sendMessage(
        conversationId,
        failedMessage.senderId,
        failedMessage.content,
        failedMessage.imageUrl
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? (saved ? { ...saved } : { ...m, status: 'sent' as const })
            : m
        )
      );

      void loadMessages(true);
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m))
      );
      setError(err.message);
    }
  };

  return { messages, isLoading, error, sendMessage, retrySend };
}