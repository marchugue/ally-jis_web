import { useState } from 'react';
import { ArrowLeft, Flag, Lightbulb, Flame, ShieldOff } from 'lucide-react';
import { Conversation } from '@/types/ally';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { ReportModal } from '@/components/chat/ReportModal';

interface ConversationInfoPanelProps {
  conversation: Conversation;
  isOnline: boolean;
  /** 'desktop' renders the [320px] right-side panel.
   *  'mobile' renders a full-screen overlay with a back button. */
  variant: 'desktop' | 'mobile';
  onClose: () => void;
}

export function ConversationInfoPanel({ conversation, isOnline, variant, onClose }: ConversationInfoPanelProps) {
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
          <ConversationInfoContent conversation={conversation} isOnline={isOnline} avatarSize="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex w-[320px] bg-white border-l border-gray-100 flex-col overflow-y-auto flex-shrink-0">
      <ConversationInfoContent conversation={conversation} isOnline={isOnline} avatarSize="sm" />
    </div>
  );
}

// Shared content block — edit this to add new info/sections/actions.
// It's used by both the desktop panel and mobile overlay above, so
// anything added here automatically shows up in both.
function ConversationInfoContent({
  conversation,
  isOnline,
  avatarSize,
}: {
  conversation: Conversation;
  isOnline: boolean;
  avatarSize: 'sm' | 'lg';
}) {
  // TODO: wire this up to real per-conversation settings once a backend
  // field/endpoint exists (e.g. conversation.icebreakersEnabled). For now
  // this is local-only UI state and resets on remount.
  const [icebreakersEnabled, setIcebreakersEnabled] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // STATIC placeholder data — replace with real fields once available:
  // conversation.sharedInterests, conversation.streakCount, etc.
  const sharedInterests = conversation.sharedInterests ?? ['Photography', 'Basketball', 'Anime'];
  const streakCount = 4;

  const handleBlock = () => {
    // TODO: wire to real block API call
    console.log('Block user:', conversation.participantId);
  };

  return (
    <div className="flex flex-col">
      {/* Profile header */}
      <div className="flex flex-col items-center text-center border-b border-gray-100 p-6">
        <AvatarDisplay
          src={conversation.participantAvatar}
          name={conversation.participantName}
          className={cn(
            "rounded-2xl object-cover mb-3",
            avatarSize === 'lg' ? "w-24 h-24" : "w-20 h-20"
          )}
        />
        <h3 className={cn(
          "font-jakarta font-bold text-gray-900",
          avatarSize === 'lg' && "text-lg"
        )}>
          {conversation.participantName}
        </h3>
        <span className={cn(
          "mt-1 text-xs font-jakarta font-medium px-2.5 py-0.5 rounded-full",
          isOnline ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Streak */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Flame size={18} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-jakarta font-semibold text-sm text-gray-900">
            {streakCount} day streak
          </p>
          <p className="font-jakarta text-xs text-gray-400">
            Keep chatting daily to grow it
          </p>
        </div>
      </div>

      {/* Shared interests */}
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

      {/* Icebreaker toggle */}
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
          onClick={() => setIcebreakersEnabled((prev) => !prev)}
          role="switch"
          aria-checked={icebreakersEnabled}
          className={cn(
            "w-11 h-6 rounded-full flex-shrink-0 relative transition-colors",
            icebreakersEnabled ? "bg-[#1A6B3C]" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
              icebreakersEnabled && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Block / Report */}
      <div className="px-6 pt-4 pb-2">
        <button
          onClick={handleBlock}
          className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-red-50 rounded-xl transition-colors px-2 -mx-2"
        >
          <ShieldOff size={17} className="text-red-400 flex-shrink-0" />
          <span className="font-jakarta text-sm text-red-500 font-medium">
            Block {conversation.participantName}
          </span>
        </button>
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

      {showReportModal && (
        <ReportModal
          participantName={conversation.participantName}
          participantId={conversation.participantId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}