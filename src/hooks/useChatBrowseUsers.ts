import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import type { ChatBrowseUserInput } from '@/lib/chatUserSearch';
import { profileService } from '@/lib/services/profileService';

function allyToBrowseInput(ally: {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  course: string | null;
}): ChatBrowseUserInput {
  return {
    id: ally.id,
    name: ally.username ? `@${ally.username}` : ally.fullName ?? 'Student',
    username: ally.username,
    avatar: ally.avatarUrl,
    course: ally.course,
  };
}

export function useChatBrowseUsers(userId: string | null, enabled: boolean) {
  const [allies, setAllies] = useState<ChatBrowseUserInput[]>([]);
  const [profiles, setProfiles] = useState<ChatBrowseUserInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !enabled) {
      setAllies([]);
      setProfiles([]);
      return;
    }

    let cancelled = false;

    async function loadAllies() {
      const items = [];
      let cursor: string | null = null;

      do {
        const page = await apiClient.listAllies(userId, cursor);
        items.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      return items.map(allyToBrowseInput);
    }

    async function load() {
      setIsLoading(true);
      try {
        const [allyItems, profileItems] = await Promise.all([
          loadAllies(),
          profileService.getAllProfiles(userId),
        ]);

        if (cancelled) return;

        setAllies(allyItems);
        setProfiles(
          profileItems.map((profile) => ({
            id: profile.id,
            name: profile.username ? `@${profile.username}` : profile.name,
            username: profile.username,
            avatar: profile.avatar,
            course: profile.course,
          })),
        );
      } catch (err) {
        console.error('Failed to load chat browse users:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return { allies, profiles, isLoading };
}
