import { memo } from 'react';
import { Conversation } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conv: Conversation) => void;
  isLoading: boolean;
  onlineUserIds?: Set<string>;
  currentUserId?: string;
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
  const previewText = conv.lastMessage
    ? `${sentByMe ? 'You: ' : ''}${conv.lastMessage}`
    : 'Start the conversation';

  return (
    <button
      onClick={() => onSelect(conv)}
      className={cn(
        "w-full p-4 flex items-center gap-3 transition-colors border-b border-gray-50",
        isActive ? "bg-[#1A6B3C]/5" : isUnreadFromThem ? "bg-[#1A6B3C]/[0.03] hover:bg-[#1A6B3C]/5" : "hover:bg-gray-50"
      )}
    >
      <div className="relative flex-shrink-0">
        <AvatarDisplay src={conv.participantAvatar} className="w-12 h-12 rounded-2xl object-cover" />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        )}
        {conv.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1A6B3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {conv.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4 className="font-jakarta font-bold text-gray-900 truncate">
            {conv.participantName}
          </h4>
          <span className={cn(
            "text-[10px] flex-shrink-0",
            isUnreadFromThem ? "text-[#1A6B3C] font-semibold" : "text-gray-400"
          )}>
            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={cn(
          "text-xs truncate",
          isUnreadFromThem ? "text-gray-900 font-semibold" : "text-gray-500"
        )}>
          {previewText}
        </p>
      </div>
    </button>
  );
});

export function ConversationList({ conversations, activeId, onSelect, isLoading, onlineUserIds, currentUserId }: ConversationListProps) {
  // isLoading is now only ever true on the very first mount (see useConversations).
  // It will never flip back to true mid-session, so this skeleton can't
  // re-appear and blank out a list that's already showing data.
  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
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
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">No conversations yet.</p>
        <p className="text-gray-400 text-xs mt-1">Match with others to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conv) => (
        <ConversationRow
          key={conv.id}
          conv={conv}
          isActive={activeId === conv.id}
          isOnline={Boolean(onlineUserIds?.has(conv.participantId))}
          sentByMe={Boolean(currentUserId) && conv.lastMessageSenderId === currentUserId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}