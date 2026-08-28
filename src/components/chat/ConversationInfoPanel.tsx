// src/components/chat/ConversationInfoPanel.tsx
import { useState } from 'react';
import { ArrowLeft, Flag, Lightbulb, ShieldOff, Trash2 } from 'lucide-react';
import { Conversation, BlockStatus } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { ReportModal } from '@/components/chat/ReportModal';
import { BlockModal } from '@/components/chat/BlockModal';
import { DeleteConversationModal, DeleteMode } from '@/components/chat/DeleteConversationModal';
import { apiClient } from '@/api/client';

interface ConversationInfoPanelProps {
  conversation: Conversation;
  isOnline: boolean;
  icebreakersEnabled: boolean;
  icebreakersLoading?: boolean;
  onIcebreakersToggle: (enabled: boolean) => void;
  blockStatus: BlockStatus;
  onBlockChange: () => void;
  onDelete?: (conv: Conversation, mode?: DeleteMode) => void;
  variant: 'desktop' | 'mobile';
  onClose: () => void;
}

export function ConversationInfoPanel({
  conversation,
  isOnline,
  icebreakersEnabled,
  icebreakersLoading,
  onIcebreakersToggle,
  blockStatus,
  onBlockChange,
  onDelete,
  variant,
  onClose,
}: ConversationInfoPanelProps) {
  if (variant === 'mobile') {
    return (
      <div className="md:hidden fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-400 hover:text-[#1A6B3C]"
            aria-label="Close conversation info"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-jakarta font-bold text-gray-900">Conversation Info</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationInfoContent
            conversation={conversation}
            isOnline={isOnline}
            avatarSize="lg"
            icebreakersEnabled={icebreakersEnabled}
            icebreakersLoading={icebreakersLoading}
            onIcebreakersToggle={onIcebreakersToggle}
            blockStatus={blockStatus}
            onBlockChange={onBlockChange}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex w-[320px] bg-white border-l border-gray-100 flex-col overflow-y-auto flex-shrink-0">
      <ConversationInfoContent
        conversation={conversation}
        isOnline={isOnline}
        avatarSize="sm"
        icebreakersEnabled={icebreakersEnabled}
        icebreakersLoading={icebreakersLoading}
        onIcebreakersToggle={onIcebreakersToggle}
        blockStatus={blockStatus}
        onBlockChange={onBlockChange}
        onDelete={onDelete}
      />
    </div>
  );
}

// ─── Shared content ──────────────────────────────────────────────────────────

function ConversationInfoContent({
  conversation,
  isOnline,
  avatarSize,
  icebreakersEnabled,
  icebreakersLoading,
  onIcebreakersToggle,
  blockStatus,
  onBlockChange,
  onDelete,
}: {
  conversation: Conversation;
  isOnline: boolean;
  avatarSize: 'sm' | 'lg';
  icebreakersEnabled: boolean;
  icebreakersLoading?: boolean;
  onIcebreakersToggle: (enabled: boolean) => void;
  blockStatus: BlockStatus;
  onBlockChange: () => void;
  onDelete?: (conv: Conversation, mode?: DeleteMode) => void;
}) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [unblockingState, setUnblockingState] = useState<'idle' | 'loading' | 'error'>('idle');

  const sharedInterests = conversation.sharedInterests ?? [];
  const isBlockedByMe = blockStatus === 'blockedByMe' || blockStatus === 'mutual';

  // ── Unblock flow ──────────────────────────────────────────────────────────
  const handleUnblock = async () => {
    setUnblockingState('loading');
    try {
      await apiClient.unblockUser(conversation.participantId);
      onBlockChange();
      setUnblockingState('idle');
    } catch (err) {
      console.error('Failed to unblock user:', err);
      setUnblockingState('error');
    }
  };

  return (
    <div className="flex flex-col">
      {/* ── Profile header ── */}
      <div className="flex flex-col items-center text-center border-b border-gray-100 p-6">
        <AvatarDisplay
          src={conversation.participantAvatar}
          name={conversation.participantName}
          className={cn(
            'rounded-2xl object-cover mb-3',
            avatarSize === 'lg' ? 'w-24 h-24' : 'w-20 h-20',
          )}
        />
        <h3 className={cn(
          'font-jakarta font-bold text-gray-900',
          avatarSize === 'lg' && 'text-lg',
        )}>
          {conversation.participantName}
        </h3>
        <span className={cn(
          'mt-1 text-xs font-jakarta font-medium px-2.5 py-0.5 rounded-full',
          isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400',
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* ── Shared interests ── */}
      {sharedInterests.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="font-jakarta text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">
            Shared Interests
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="text-xs font-jakarta bg-[#1A6B3C]/8 text-[#1A6B3C] px-2.5 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Icebreaker toggle ── */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1A6B3C]/8 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={18} className="text-[#1A6B3C]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-jakarta font-semibold text-sm text-gray-900">
            Icebreaker suggestions
          </p>
          <p className="font-jakarta text-xs text-gray-400">
            Show conversation starters
          </p>
        </div>
        <button
          onClick={() => onIcebreakersToggle(!icebreakersEnabled)}
          disabled={icebreakersLoading}
          role="switch"
          aria-checked={icebreakersEnabled}
          className={cn(
            'w-11 h-6 rounded-full flex-shrink-0 relative transition-colors',
            icebreakersEnabled ? 'bg-[#1A6B3C]' : 'bg-gray-200',
            icebreakersLoading && 'opacity-50 cursor-not-allowed',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
              icebreakersEnabled && 'translate-x-5',
            )}
          />
        </button>
      </div>

      {/* ── Block / Delete / Report ── */}
      <div className="px-6 pt-4 pb-2 space-y-1">
        {isBlockedByMe ? (
          <>
            {unblockingState === 'idle' && (
              <button
                onClick={handleUnblock}
                className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-emerald-50 rounded-xl transition-colors px-2 -mx-2"
              >
                <ShieldOff size={17} className="text-emerald-500 flex-shrink-0" />
                <span className="font-jakarta text-sm text-emerald-600 font-medium">
                  Unblock {conversation.participantName}
                </span>
              </button>
            )}

            {unblockingState === 'loading' && (
              <div className="flex items-center gap-3 py-2.5 px-2 -mx-2">
                <ShieldOff size={17} className="text-emerald-300 flex-shrink-0" />
                <span className="font-jakarta text-sm text-emerald-300 font-medium">
                  Unblocking…
                </span>
              </div>
            )}

            {unblockingState === 'error' && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 mb-1">
                <p className="font-jakarta text-xs text-red-600 mb-2">
                  Something went wrong. Please try again.
                </p>
                <button
                  onClick={handleUnblock}
                  className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-jakarta text-xs text-white font-semibold transition-colors"
                >
                  Retry unblock
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => setShowBlockModal(true)}
            className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-red-50 rounded-xl transition-colors px-2 -mx-2"
          >
            <ShieldOff size={17} className="text-red-400 flex-shrink-0" />
            <span className="font-jakarta text-sm text-red-500 font-medium">
              Block {conversation.participantName}
            </span>
          </button>
        )}

        {/* ── Delete Conversation Button ── */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-red-50 rounded-xl transition-colors px-2 -mx-2"
        >
          <Trash2 size={17} className="text-red-400 flex-shrink-0" />
          <span className="font-jakarta text-sm text-red-500 font-medium">
            Delete conversation
          </span>
        </button>

        {/* Report — always available */}
        <button
          onClick={() => setShowReportModal(true)}
          className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-red-50 rounded-xl transition-colors px-2 -mx-2"
        >
          <Flag size={17} className="text-red-400 flex-shrink-0" />
          <span className="font-jakarta text-sm text-red-500 font-medium">
            Report {conversation.participantName}
          </span>
        </button>
      </div>

      {/* ── Modals ── */}
      {showBlockModal && (
        <BlockModal
          participantName={conversation.participantName}
          participantId={conversation.participantId}
          onClose={() => setShowBlockModal(false)}
          onBlockSuccess={onBlockChange}
        />
      )}

      {showDeleteModal && (
        <DeleteConversationModal
          participantName={conversation.participantName}
          onClose={() => setShowDeleteModal(false)}
          onConfirmDelete={(mode) => {
            setShowDeleteModal(false);
            if (onDelete) {
              onDelete(conversation, mode);
            }
          }}
        />
      )}

      {showReportModal && (
        <ReportModal
          participantName={conversation.participantName}
          participantId={conversation.participantId}
          conversationId={conversation.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}