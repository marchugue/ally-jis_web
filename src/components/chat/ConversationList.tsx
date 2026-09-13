import { memo } from 'react';
import { Drama, Flame } from 'lucide-react';
import { Conversation } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conv: Conversation) => void;
  isLoading: boolean;
  onlineUserIds?: Set<string>;
  currentUserId?: string;
  /** When true, rows render without an inner scroll container (parent scrolls). */
  embedded?: boolean;
}

interface ConversationRowProps {
  conv: Conversation;
  isActive: boolean;
  isOnline: boolean;
  sentByMe: boolean;
  onSelect: (conv: Conversation) => void;
}

// Each row only re-renders if ITS OWN props changed — not when a sibling
// row's data changes, and not when the list re-fetches but this row's
// underlying data is identical (see mergeConversations in useConversations).
const ConversationRow = memo(function ConversationRow({
  conv,
  isActive,
  isOnline,
  sentByMe,
  onSelect,
}: ConversationRowProps) {
  const isUnreadFromThem = !sentByMe && conv.unreadCount > 0;
  const isAnonymous = conv.variant !== 'regular';
  const isEnded = conv.variant === 'anonymous_ended';
  const previewText = conv.lastMessage
    ? `${sentByMe ? 'You: ' : ''}${conv.lastMessage}`
    : 'Start the conversation';

  return (
    <div className="relative border-b border-gray-50 dark:border-white/5">
      <button
        onClick={() => onSelect(conv)}
        className={cn(
          'w-full p-4 flex items-center gap-3 transition-colors',
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
            <AnonymousAvatar avatarKey={conv.matchInfo?.partnerAvatar} size={48} className="rounded-full" />
          ) : (
            <AvatarDisplay src={conv.participantAvatar} className="w-12 h-12 rounded-full object-cover" />
          )}
          {!isAnonymous && isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0D131F] rounded-full" />
          )}
          {conv.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1A6B3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D131F]">
              {conv.unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-jakarta font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
              <span className="truncate">{conv.participantName}</span>
              {isAnonymous && <Drama size={12} className="text-[#3B8C7E] dark:text-emerald-400 shrink-0" />}
              {(conv.dayStreak ?? 0) > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#eb5600] dark:text-orange-400 shrink-0"
                  title={`${conv.dayStreak}-day chat streak`}
                >
                  <Flame size={12} className="text-[#eb5600] dark:text-orange-400 fill-[#eb5600] dark:fill-orange-400" />
                  <span>{conv.dayStreak}d</span>
                </span>
              )}
            </h4>
            <span className={cn(
              'text-[10px] flex-shrink-0',
              isUnreadFromThem ? 'text-[#1A6B3C] dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500',
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
    </div>
  );
});

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
  onlineUserIds,
  currentUserId,
  embedded = false,
}: ConversationListProps) {
  // isLoading is now only ever true on the very first mount (see useConversations).
  // It will never flip back to true mid-session, so this skeleton can't
  // re-appear and blank out a list that's already showing data.
  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
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
      isOnline={Boolean(onlineUserIds?.has(conv.participantId))}
      sentByMe={Boolean(currentUserId) && conv.lastMessageSenderId === currentUserId}
      onSelect={onSelect}
    />
  ));

  if (embedded) return <>{rows}</>;

  return (
    <div className="overflow-y-auto h-full">
      {rows}
    </div>
  );
}
