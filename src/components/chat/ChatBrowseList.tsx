import { MessageCircle } from 'lucide-react';
import type { ChatBrowseUser } from '@/lib/chatUserSearch';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { cn } from '@/lib/utils';

interface ChatBrowseListProps {
  allies: ChatBrowseUser[];
  others: ChatBrowseUser[];
  onSelect: (user: ChatBrowseUser) => void;
  startingUserId?: string | null;
  onlineUserIds?: Set<string>;
  showSections?: boolean;
  /** When true, rows render without an inner scroll container (parent scrolls). */
  embedded?: boolean;
}

function BrowseRow({
  user,
  onSelect,
  starting,
  isOnline,
}: {
  user: ChatBrowseUser;
  onSelect: (user: ChatBrowseUser) => void;
  starting: boolean;
  isOnline: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(user)}
      disabled={starting}
      className={cn(
        'w-full p-4 flex items-center gap-3 transition-colors border-b border-gray-50',
        'hover:bg-gray-50 disabled:opacity-60',
      )}
    >
      <div className="relative flex-shrink-0">
        <AvatarDisplay
          src={user.avatar ?? undefined}
          name={user.name}
          className="w-12 h-12 rounded-2xl object-cover"
        />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-jakarta font-bold text-gray-900 truncate">{user.name}</h4>
        <p className="text-xs text-gray-500 truncate">
          {user.course ?? (user.isAlly ? 'Your ally' : 'Start a conversation')}
        </p>
      </div>
      <div className="flex-shrink-0 text-[#1A6B3C]">
        <MessageCircle size={18} />
      </div>
    </button>
  );
}

function Section({
  title,
  users,
  onSelect,
  startingUserId,
  onlineUserIds,
}: {
  title: string;
  users: ChatBrowseUser[];
  onSelect: (user: ChatBrowseUser) => void;
  startingUserId?: string | null;
  onlineUserIds?: Set<string>;
}) {
  if (users.length === 0) return null;

  return (
    <div>
      <p className="px-4 py-2 text-[10px] font-jakarta font-bold uppercase tracking-wider text-gray-400 bg-gray-50/80 sticky top-0 z-10">
        {title}
      </p>
      {users.map((user) => (
        <BrowseRow
          key={user.id}
          user={user}
          onSelect={onSelect}
          starting={startingUserId === user.id}
          isOnline={Boolean(onlineUserIds?.has(user.id))}
        />
      ))}
    </div>
  );
}

export function ChatBrowseList({
  allies,
  others,
  onSelect,
  startingUserId,
  onlineUserIds,
  showSections = true,
  embedded = false,
}: ChatBrowseListProps) {
  if (allies.length === 0 && others.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">No people found.</p>
        <p className="text-gray-400 text-xs mt-1">Try a different search or connect with classmates.</p>
      </div>
    );
  }

  if (!showSections) {
    const rows = [...allies, ...others].map((user) => (
      <BrowseRow
        key={user.id}
        user={user}
        onSelect={onSelect}
        starting={startingUserId === user.id}
        isOnline={Boolean(onlineUserIds?.has(user.id))}
      />
    ));

    if (embedded) return <>{rows}</>;

    return (
      <div className="overflow-y-auto h-full">
        {rows}
      </div>
    );
  }

  const sections = (
    <>
      <Section
        title="Allies"
        users={allies}
        onSelect={onSelect}
        startingUserId={startingUserId}
        onlineUserIds={onlineUserIds}
      />
      <Section
        title="Others"
        users={others}
        onSelect={onSelect}
        startingUserId={startingUserId}
        onlineUserIds={onlineUserIds}
      />
    </>
  );

  if (embedded) return sections;

  return (
    <div className="overflow-y-auto h-full">
      {sections}
    </div>
  );
}
