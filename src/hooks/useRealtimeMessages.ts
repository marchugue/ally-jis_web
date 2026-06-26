import { useEffect, useState, useRef, useCallback } from 'react';
import { isApiConfigured } from '@/api/client';
import { Message } from '../types/ally';
import { chatService } from '../lib/services/chatService';

const POLL_INTERVAL_MS = 5000;

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !isApiConfigured) return;

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await chatService.getMessages(conversationId);
      const lastId = data[data.length - 1]?.id ?? null;
      if (lastId !== lastMessageIdRef.current || !silent) {
        lastMessageIdRef.current = lastId;
        setMessages(data);
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !isApiConfigured) {
      setMessages([]);
      return;
    }

    void loadMessages();
    const interval = setInterval(() => {
      void loadMessages(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId, loadMessages]);

  const sendMessage = async (senderId: string, content: string | null, imageUrl?: string | null) => {
    if (!conversationId) return;

    try {
      await chatService.sendMessage(conversationId, senderId, content, imageUrl);
      await loadMessages(true);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { messages, isLoading, error, sendMessage };
}
