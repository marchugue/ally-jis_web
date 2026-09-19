import { memo, useEffect, useRef } from 'react';
import { Drama, Trash2 } from 'lucide-react';
import { Conversation } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { ChatStreakBadge } from '@/components/match/ChatStreakBadge';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  activeIsStreakActiveToday?: boolean;
  onSelect: (conv: Conversation) => void;
  onDelete?: (conv: Conversation) => void;
  isLoading: boolean;
  onlineUserIds?: Set<string>;
  currentUserId?: string;
  /** When true, rows render without an inner scroll container (parent scrolls). */
  embedded?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

interface ConversationRowProps {
  conv: Conversation;
  isActive: boolean;
  activeIsStreakActiveToday?: boolean;
  isOnline: boolean;
  sentByMe: boolean;
  onSelect: (conv: Conversation) => void;
  onDelete?: (conv: Conversation) => void;
}

// Each row only re-renders if ITS OWN props changed — not when a sibling
// row's data changes, and not when the list re-fetches but this row's
// underlying data is identical (see mergeConversations in useConversations).
const ConversationRow = memo(function ConversationRow({
  conv,
  isActive,
  activeIsStreakActiveToday,
  isOnline,
  sentByMe,
  onSelect,
  onDelete,
}: ConversationRowProps) {
  const isUnreadFromThem = !sentByMe && conv.unreadCount > 0;
  const isAnonymous = conv.variant !== 'regular';
  const isEnded = conv.variant === 'anonymous_ended';
  const previewText = conv.lastMessage
    ? `${sentByMe ? 'You: ' : ''}${conv.lastMessage}`
    : 'Start the conversation';

  const streak = conv.dayStreak ?? conv.matchInfo?.dayStreak ?? 0;
  const isStreakActive = Boolean(
    isActive && activeIsStreakActiveToday !== undefined
      ? activeIsStreakActiveToday
      : (conv.streakActiveToday ?? conv.matchInfo?.streakActiveToday)
  );

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(conv)}
        className={cn(
          'w-full p-4 flex items-center gap-4 md:gap-3 transition-colors',
          isEnded && 'opacity-60',
          isActive
            ? 'bg-[#1A6B3C]/5 dark:bg-emerald-500/10'
            : isUnreadFromThem
            ? 'bg-[#1A6B3C]/[0.03] dark:bg-emerald-500/5 hover:bg-[#1A6B3C]/5 dark:hover:bg-white/5'
            : 'hover:bg-gray-50 dark:hover:bg-white/5',
        )}
      >
        <div className="relative flex-shrink-0">
          {isAnonymous ? (
            <AnonymousAvatar avatarKey={conv.matchInfo?.partnerAvatar} size={48} className="w-14 h-14 md:w-12 md:h-12 rounded-full" />
          ) : (
            <AvatarDisplay src={conv.participantAvatar} className="w-14 h-14 md:w-12 md:h-12 rounded-full object-cover" textClassName="text-xl md:text-lg" />
          )}
          {!isAnonymous && isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-3 md:h-3 bg-emerald-500 border-2 border-white dark:border-[#0D131F] rounded-full" />
          )}
          {conv.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#1A6B3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D131F]">
              {conv.unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-jakarta font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5 min-w-0 pr-1">
              <span className="truncate">{conv.participantName}</span>
              {isAnonymous && <Drama size={12} className="text-[#3B8C7E] dark:text-emerald-400 shrink-0" />}
              {streak > 0 && (
                <ChatStreakBadge
                  dayStreak={streak}
                  isStreakActiveToday={isStreakActive}
                  size="sm"
                  showDaysSuffix
                  className="shrink-0"
                />
              )}
            </h4>
            <span className={cn(
              'text-[10px] flex-shrink-0 transition-opacity ml-1',
              isUnreadFromThem ? 'text-[#1A6B3C] dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500',
              onDelete && 'group-hover:opacity-0',
            )}>
              {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className={cn(
            'text-xs truncate',
            isUnreadFromThem ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400',
          )}>
            {isEnded ? 'Match ended' : previewText}
          </p>
        </div>
      </button>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conv);
          }}
          title={isAnonymous ? "Delete anonymous chat" : "Delete chat"}
          aria-label="Delete conversation"
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3.5 p-1.5 rounded-lg bg-white/95 dark:bg-[#111827]/95 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-xs border border-gray-200/80 dark:border-white/10 z-10"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
});

export function ConversationList({
  conversations,
  activeId,
  activeIsStreakActiveToday,
  onSelect,
  onDelete,
  isLoading,
  onlineUserIds,
  currentUserId,
  embedded = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ConversationListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // isLoading is now only ever true on the very first mount (see useConversations).
  // It will never flip back to true mid-session, so this skeleton can't
  // re-appear and blank out a list that's already showing data.
  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 md:gap-3 p-3 rounded-2xl">
            <Skeleton className="w-14 h-14 md:w-12 md:h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    if (embedded) return null;
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">No conversations yet.</p>
        <p className="text-gray-400 text-xs mt-1">Match with others to start chatting!</p>
      </div>
    );
  }

  const rows = conversations.map((conv) => (
    <ConversationRow
      key={conv.id}
      conv={conv}
      isActive={activeId === conv.id}
      activeIsStreakActiveToday={activeId === conv.id ? activeIsStreakActiveToday : undefined}
      isOnline={Boolean(onlineUserIds?.has(conv.participantId))}
      sentByMe={Boolean(currentUserId) && conv.lastMessageSenderId === currentUserId}
      onSelect={onSelect}
      onDelete={onDelete}
    />
  ));

  const loadMoreIndicator = hasMore ? (
    <div ref={sentinelRef} className="p-3 text-center">
      {isLoadingMore ? (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-jakarta py-2">
          <div className="w-3.5 h-3.5 border-2 border-[#1A6B3C] dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading more chats…</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onLoadMore}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-jakarta font-medium py-1 transition-colors cursor-pointer"
        >
          Load more chats
        </button>
      )}
    </div>
  ) : null;

  if (embedded) {
    return (
      <>
        {rows}
        {loadMoreIndicator}
      </>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {rows}
      {loadMoreIndicator}
    </div>
  );
}
