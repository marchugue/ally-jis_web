// src/components/chat/BlockedBanner.tsx
import { ShieldOff } from 'lucide-react';
import { BlockStatus } from '@/types/ally';

interface BlockedBannerProps {
  participantName: string;
  blockStatus: BlockStatus;
  onUnblock: () => void;
  unblocking: boolean;
}

export function BlockedBanner({ participantName, blockStatus, onUnblock, unblocking }: BlockedBannerProps) {
  const iBlockedThem = blockStatus === 'blockedByMe' || blockStatus === 'mutual';

  return (
    <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center gap-3 flex-shrink-0">
      <ShieldOff size={16} className="text-red-400 flex-shrink-0" />
      <p className="flex-1 font-jakarta text-xs text-red-600 leading-relaxed">
        {iBlockedThem
          ? `You blocked ${participantName}. They can't message you until you unblock them.`
          : `You can't reply to this conversation.`}
      </p>
      {iBlockedThem && (
        <button
          onClick={onUnblock}
          disabled={unblocking}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white border border-red-200 font-jakarta text-xs text-red-600 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {unblocking ? 'Unblocking…' : 'Unblock'}
        </button>
      )}
    </div>
  );
}