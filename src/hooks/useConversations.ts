import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Conversation } from '../types/ally';
import { chatService } from '../lib/services/chatService';
import { profileService } from '../lib/services/profileService';

const POLL_INTERVAL_MS = 15000;

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (silent = false) => {
    if (!userId || !isApiConfigured) return;

    if (!silent) {
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

      setConversations(Array.from(deduped.values()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!isApiConfigured || !userId) return;

    void loadConversations();
    const interval = setInterval(() => {
      void loadConversations();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [userId, loadConversations]);

  return { conversations, isLoading, error, refresh: loadConversations };
}
