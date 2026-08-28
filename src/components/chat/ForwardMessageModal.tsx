import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Conversation } from '@/types/ally';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { cn } from '@/lib/utils';

interface ForwardMessageModalProps {
  conversations: Conversation[];
  currentConversationId: string;
  onClose: () => void;
  onSelect: (conversation: Conversation) => void;
  forwarding?: boolean;
}

export function ForwardMessageModal({
  conversations,
  currentConversationId,
  onClose,
  onSelect,
  forwarding = false,
}: ForwardMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (conv.id === currentConversationId) return false;
      const blockedByMe = conv.blockStatus === 'blockedByMe' || conv.blockStatus === 'mutual';
      if (blockedByMe) return false;
      if (!q) return true;
      return conv.participantName.toLowerCase().includes(q);
    });
  }, [conversations, currentConversationId, searchQuery]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/30 p-0 md:p-4">
      <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-jakarta font-bold text-gray-900">Forward to</h3>
          <button
            onClick={onClose}
            disabled={forwarding}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close forward modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2.5 text-sm font-jakarta text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1A6B3C]/20"
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center font-jakarta text-sm text-gray-400">
              No conversations available to forward to.
            </p>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                disabled={forwarding}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors',
                  forwarding && 'opacity-60 cursor-not-allowed'
                )}
              >
                <AvatarDisplay
                  src={conv.participantAvatar}
                  name={conv.participantName}
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-jakarta font-semibold text-sm text-gray-900 truncate">
                    {conv.participantName}
                  </p>
                  <p className="font-jakarta text-xs text-gray-400 truncate">
                    {conv.lastMessage || 'Start the conversation'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
