import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, Lightbulb, LogOut, ShieldOff, ShieldAlert, Trash2, X, Bell } from 'lucide-react';
import { Conversation, BlockStatus } from '@/types/ally';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { AnonymousAvatar } from '@/components/match/AnonymousAvatar';
import type { AvatarRevealView } from '@/api/types';
import { ChatStreakBadge } from '@/components/match/ChatStreakBadge';
import { ReportModal } from '@/components/chat/ReportModal';
import { BlockModal } from '@/components/chat/BlockModal';
import { RestrictModal } from '@/components/chat/RestrictModal';
import { DeleteConversationModal, DeleteMode } from '@/components/chat/DeleteConversationModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/api/client';

interface ConversationInfoPanelProps {
  conversation: Conversation;
  isOnline: boolean;
  isStreakActiveToday?: boolean;
  icebreakersEnabled: boolean;
  icebreakersLoading?: boolean;
  onIcebreakersToggle: (enabled: boolean) => void;
  blockStatus: BlockStatus;
  onBlockChange: () => void;
  onDelete?: (conv: Conversation, mode?: DeleteMode) => void;
  onEndMatch?: () => void;
  sharedInterests?: string[];
  variant: 'desktop' | 'mobile';
  onClose: () => void;
  avatarReveal?: AvatarRevealView | null;
}

export function ConversationInfoPanel({
  conversation,
  isOnline,
  isStreakActiveToday,
  icebreakersEnabled,
  icebreakersLoading,
  onIcebreakersToggle,
  blockStatus,
  onBlockChange,
  onDelete,
  onEndMatch,
  sharedInterests,
  variant,
  onClose,
  avatarReveal,
}: ConversationInfoPanelProps) {
  if (variant === 'mobile') {
    return (
      <div className="md:hidden fixed inset-0 z-[70] bg-white dark:bg-[#0D131F] flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-gray-200/80 dark:border-white/10 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-black dark:text-white hover:text-gray-600 transition-colors"
            aria-label="Close conversation info"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-jakarta font-bold text-base text-black dark:text-white">Conversation Info</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationInfoContent
            conversation={conversation}
            isOnline={isOnline}
            isStreakActiveToday={isStreakActiveToday}
            avatarSize="lg"
            icebreakersEnabled={icebreakersEnabled}
            icebreakersLoading={icebreakersLoading}
            onIcebreakersToggle={onIcebreakersToggle}
            blockStatus={blockStatus}
            onBlockChange={onBlockChange}
            onDelete={onDelete}
            onEndMatch={onEndMatch}
            sharedInterests={sharedInterests}
            avatarReveal={avatarReveal}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex w-[350px] h-full bg-white dark:bg-[#0D131F] flex-col overflow-y-auto flex-shrink-0 border-l border-gray-200/80 dark:border-white/10 select-none custom-scrollbar"
    >
      {/* Desktop Header - flat, seamless with conversation and chat list windows */}
      <div className="p-4 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-[#0D131F] sticky top-0 z-10">
        <h3 className="font-jakarta font-bold text-sm text-black dark:text-white leading-tight">
          Conversation Info
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="Close conversation info"
          title="Close info panel"
        >
          <X size={16} className="stroke-[2.5]" />
        </button>
      </div>
      <ConversationInfoContent
        conversation={conversation}
        isOnline={isOnline}
        isStreakActiveToday={isStreakActiveToday}
        avatarSize="sm"
        icebreakersEnabled={icebreakersEnabled}
        icebreakersLoading={icebreakersLoading}
        onIcebreakersToggle={onIcebreakersToggle}
        blockStatus={blockStatus}
        onBlockChange={onBlockChange}
        onDelete={onDelete}
        onEndMatch={onEndMatch}
        sharedInterests={sharedInterests}
        avatarReveal={avatarReveal}
      />
    </div>
  );
}

// ─── Shared content ──────────────────────────────────────────────────────────

function ConversationInfoContent({
  conversation,
  isOnline,
  isStreakActiveToday,
  avatarSize,
  icebreakersEnabled,
  icebreakersLoading,
  onIcebreakersToggle,
  blockStatus,
  onBlockChange,
  onDelete,
  onEndMatch,
  sharedInterests: extraSharedInterests,
  avatarReveal,
}: {
  conversation: Conversation;
  isOnline: boolean;
  isStreakActiveToday?: boolean;
  avatarSize: 'sm' | 'lg';
  icebreakersEnabled: boolean;
  icebreakersLoading?: boolean;
  onIcebreakersToggle: (enabled: boolean) => void;
  blockStatus: BlockStatus;
  onBlockChange: () => void;
  onDelete?: (conv: Conversation, mode?: DeleteMode) => void;
  onEndMatch?: () => void;
  sharedInterests?: string[];
  avatarReveal?: AvatarRevealView | null;
}) {
  const navigate = useNavigate();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [unblockingState, setUnblockingState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isRestrictedByMe, setIsRestrictedByMe] = useState(false);
  const [unrestrictingState, setUnrestrictingState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);

  const isAnonymous = conversation.variant.startsWith('anonymous');
  const sharedInterests =
    (extraSharedInterests && extraSharedInterests.length > 0)
      ? extraSharedInterests
      : (conversation.sharedInterests ?? []);
  const isBlockedByMe = blockStatus === 'blockedByMe' || blockStatus === 'mutual';

  useEffect(() => {
    if (!conversation.participantId || isAnonymous) return;
    apiClient.checkIsRestricted(conversation.participantId)
      .then((res) => setIsRestrictedByMe(res.restrictedByMe))
      .catch(() => {});
    apiClient.checkIsMuted(conversation.participantId)
      .then((res) => setIsMuted(res.muted))
      .catch(() => {});
  }, [conversation.participantId, isAnonymous]);

  const handleToggleMute = async () => {
    if (muteLoading || !conversation.participantId) return;
    setMuteLoading(true);
    try {
      if (isMuted) {
        await apiClient.unmuteUser(conversation.participantId);
        setIsMuted(false);
      } else {
        await apiClient.muteUser({ mutedUserId: conversation.participantId });
        setIsMuted(true);
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    } finally {
      setMuteLoading(false);
    }
  };

  const handleUnrestrict = async () => {
    setUnrestrictingState('loading');
    try {
      await apiClient.unrestrictUser(conversation.participantId);
      setIsRestrictedByMe(false);
      setUnrestrictingState('idle');
    } catch (err) {
      console.error('Failed to unrestrict user:', err);
      setUnrestrictingState('error');
    }
  };

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
    <div className="flex flex-col py-3">
      {/* ── 1. Profile header (centered, no anonymous badge) ── */}
      <div className="flex flex-col items-center text-center px-6 pt-3 pb-4">
        {isAnonymous ? (
          <AnonymousAvatar
            avatarKey={conversation.matchInfo?.partnerAvatar || conversation.participantAvatar || 'fox'}
            size={avatarSize === 'lg' ? 88 : 72}
            className="rounded-full mb-3"
          />
        ) : (
          <AvatarDisplay
            src={conversation.participantAvatar}
            name={conversation.participantName}
            className={avatarSize === 'lg' ? 'w-24 h-24 rounded-full object-cover mb-3' : 'w-20 h-20 rounded-full object-cover mb-3'}
          />
        )}
        <div className="flex items-center justify-center gap-1.5 min-w-0 flex-wrap">
          <h3 className={`font-jakarta font-bold text-black dark:text-white ${avatarSize === 'lg' ? 'text-lg' : 'text-base'}`}>
            {conversation.participantName}
          </h3>
          {(conversation.dayStreak ?? conversation.matchInfo?.dayStreak ?? 0) > 0 && (
            <ChatStreakBadge
              dayStreak={conversation.dayStreak ?? conversation.matchInfo?.dayStreak ?? 0}
              isStreakActiveToday={isStreakActiveToday}
              size={avatarSize === 'lg' ? 'md' : 'sm'}
            />
          )}
        </div>
        {!isAnonymous && (
          <span className="mt-1 text-xs font-jakarta font-medium text-gray-500 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        )}
      </div>

      {/* ── 2. Shared interests (centered, no divider) ── */}
      {sharedInterests.length > 0 && (
        <div className="px-6 py-2 flex flex-col items-center text-center">
          <h4 className="font-jakarta text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 text-center">
            Shared Interests
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="text-xs font-jakarta bg-gray-100 dark:bg-white/10 text-black dark:text-white px-3 py-1 rounded-full font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Chat Controls & Settings (flat rows, black text, solid icons, no containers, no dividers) ── */}
      <div className="pt-2 flex flex-col">
        {/* Mute notifications */}
        <div
          onClick={handleToggleMute}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <Bell size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              Mute notifications
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isMuted}
            disabled={muteLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute();
            }}
            className={`w-11 h-6 rounded-full flex-shrink-0 relative transition-colors ${
              isMuted ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
            } ${muteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                isMuted ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Icebreaker suggestions */}
        <div
          onClick={() => onIcebreakersToggle(!icebreakersEnabled)}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <Lightbulb size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              Icebreaker suggestions
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={icebreakersEnabled}
            disabled={icebreakersLoading}
            onClick={(e) => {
              e.stopPropagation();
              onIcebreakersToggle(!icebreakersEnabled);
            }}
            className={`w-11 h-6 rounded-full flex-shrink-0 relative transition-colors ${
              icebreakersEnabled ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
            } ${icebreakersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                icebreakersEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Restrict action */}
        {isRestrictedByMe ? (
          <button
            type="button"
            onClick={handleUnrestrict}
            disabled={unrestrictingState === 'loading'}
            className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
          >
            <ShieldAlert size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              {unrestrictingState === 'loading' ? 'Unrestricting…' : `Unrestrict ${conversation.participantName}`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowRestrictModal(true)}
            className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
          >
            <ShieldAlert size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              Restrict {conversation.participantName}
            </span>
          </button>
        )}

        {/* Block action */}
        {isBlockedByMe ? (
          <button
            type="button"
            onClick={handleUnblock}
            disabled={unblockingState === 'loading'}
            className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
          >
            <ShieldOff size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              {unblockingState === 'loading' ? 'Unblocking…' : `Unblock ${conversation.participantName}`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowBlockModal(true)}
            className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
          >
            <ShieldOff size={18} className="text-black dark:text-white fill-current shrink-0" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              Block {conversation.participantName}
            </span>
          </button>
        )}

        {/* Report action */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
        >
          <Flag size={18} className="text-black dark:text-white fill-current shrink-0" />
          <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
            Report {conversation.participantName}
          </span>
        </button>

        {/* End match action (for active anonymous conversations) */}
        {isAnonymous && conversation.variant !== 'anonymous_ended' && (
          <button
            type="button"
            onClick={() => setShowEndMatchDialog(true)}
            className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} className="text-black dark:text-white shrink-0 stroke-[2.2]" />
            <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
              End match
            </span>
          </button>
        )}

        {/* Delete conversation */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3.5 px-6 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors"
        >
          <Trash2 size={18} className="text-black dark:text-white fill-current shrink-0" />
          <span className="font-jakarta font-medium text-sm text-black dark:text-white truncate">
            Delete conversation
          </span>
        </button>
      </div>

      {/* ── Modals & Dialogs ── */}
      {showBlockModal && (
        <BlockModal
          participantName={conversation.participantName}
          participantId={conversation.participantId}
          participantAvatar={conversation.participantAvatar}
          onClose={() => setShowBlockModal(false)}
          onBlockSuccess={onBlockChange}
        />
      )}

      {showRestrictModal && (
        <RestrictModal
          participantName={conversation.participantName}
          participantId={conversation.participantId}
          participantAvatar={conversation.participantAvatar}
          onClose={() => setShowRestrictModal(false)}
          onRestrictSuccess={() => {
            setIsRestrictedByMe(true);
            navigate('/restricted-users');
          }}
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

      {/* End Match Confirmation Alert */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md p-6 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-jakarta text-lg font-bold text-gray-900 dark:text-white">
              End this match?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-jakarta text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Ending this match will close the conversation and disable messaging for both you and your match. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-6">
            <AlertDialogCancel className="rounded-xl px-4 py-2 font-jakarta font-semibold text-sm border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2 font-jakarta font-semibold text-sm transition-colors shadow-sm"
              onClick={() => {
                setShowEndMatchDialog(false);
                onEndMatch?.();
              }}
            >
              End match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}