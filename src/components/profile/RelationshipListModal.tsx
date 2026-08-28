// src/components/profile/RelationshipListModal.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { apiClient } from '@/api/client';
import type { AllyListItem, FollowListItem } from '@/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ListKind = 'followers' | 'following' | 'allies';

interface RelationshipListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  kind: ListKind;
  title: string;
}

type ListItem = FollowListItem | AllyListItem;

const TITLES: Record<ListKind, string> = {
  followers: 'Followers',
  following: 'Following',
  allies: 'Allies',
};

export function RelationshipListModal({ open, onOpenChange, userId, kind }: RelationshipListModalProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchPage = async (pageCursor: string | null) => {
    if (kind === 'allies') return apiClient.listAllies(userId, pageCursor);
    if (kind === 'followers') return apiClient.listFollowers(userId, pageCursor);
    return apiClient.listFollowing(userId, pageCursor);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setCursor(null);
    fetchPage(null)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, kind]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const goToProfile = (id: string) => {
    onOpenChange(false);
    navigate(`/profile/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl max-h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-fraunces text-xl">{TITLES[kind]}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading && !hasLoadedOnce ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#1A6B3C]" size={22} />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 font-jakarta py-10">Nobody here yet.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToProfile(item.id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <AvatarDisplay
                    src={item.avatarUrl}
                    name={item.fullName ?? item.username ?? 'Student'}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-jakarta font-semibold text-sm text-gray-900 truncate">
                      {item.username ? `@${item.username}` : item.fullName ?? 'Student'}
                    </p>
                    {item.course && <p className="font-jakarta text-xs text-gray-400 truncate">{item.course}</p>}
                  </div>
                </button>
              ))}

              {cursor && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full text-center text-xs font-jakarta font-semibold text-[#1A6B3C] py-3 hover:underline disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
