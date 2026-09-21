// src/components/profile/RelationshipListModal.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import type { AllyListItem, FollowListItem, FollowSortBy } from '@/api/client';
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

  // Search & sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<FollowSortBy>('recent');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPage = async (pageCursor: string | null, search?: string, sort?: FollowSortBy) => {
    const options = {
      cursor: pageCursor,
      search: search?.trim() || undefined,
      sortBy: sort,
    };
    if (kind === 'allies') return apiClient.listAllies(userId, options);
    if (kind === 'followers') return apiClient.listFollowers(userId, options);
    return apiClient.listFollowing(userId, options);
  };

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSortBy('recent');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setCursor(null);
    fetchPage(null, debouncedQuery, sortBy)
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
  }, [open, userId, kind, debouncedQuery, sortBy]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor, debouncedQuery, sortBy);
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

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 pt-1 pb-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${TITLES[kind].toLowerCase()}...`}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-jakarta rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]/30 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center rounded-full border border-gray-200 dark:border-white/10 p-0.5 bg-gray-50 dark:bg-white/5 shrink-0">
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`px-2.5 py-1 text-[11px] font-jakarta font-medium rounded-full transition-all ${
                sortBy === 'recent'
                  ? 'bg-white dark:bg-[#1A6B3C] text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1 text-[11px] font-jakarta font-medium rounded-full transition-all ${
                sortBy === 'name'
                  ? 'bg-white dark:bg-[#1A6B3C] text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading && !hasLoadedOnce ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#1A6B3C]" size={22} />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 font-jakarta py-10">
              {debouncedQuery ? `No results for "${debouncedQuery}"` : 'Nobody here yet.'}
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const isAlly = kind === 'allies' || (item as any).isAlly || (item as any).is_ally;
                return (
                  <button
                    key={item.id}
                    onClick={() => goToProfile(item.id)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors text-left hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {isAlly ? (
                      <AvatarDisplay
                        src={item.avatarUrl}
                        name={item.fullName ?? item.username ?? 'Student'}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <AnonymousAvatar
                        avatarKey={(item as any).avatarKey || 'fox'}
                        size={44}
                        className="rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {isAlly ? (item.username ? `@${item.username}` : item.fullName ?? 'Student') : 'Anonymous Peer'}
                      </p>
                      <p className="font-jakarta text-xs text-gray-400 truncate">
                        {isAlly ? item.course : 'Protected · Campus Student'}
                      </p>
                    </div>
                  </button>
                );
              })}

              {cursor && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full text-center text-xs font-jakarta font-semibold text-[#1A6B3C] dark:text-emerald-400 py-3 hover:underline disabled:opacity-60"
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
