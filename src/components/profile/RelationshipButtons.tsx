// src/components/profile/RelationshipButtons.tsx

import { useState } from 'react';
import { MessageCircle, UserCheck, UserMinus } from 'lucide-react';
import { apiClient } from '@/api/client';
import { chatService } from '@/lib/services/chatService';
import type { RelationshipStatus } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RelationshipButtonsProps {
  targetUserId: string;
  targetName: string;
  allyStatus: RelationshipStatus;
  isFollowing: boolean;
  isFollowedBy: boolean;
  onAllyStatusChange: (status: RelationshipStatus) => void;
  onFollowChange: (isFollowing: boolean) => void;
  onConversationReady?: (conversationId: string) => void;
}

export function RelationshipButtons({
  targetUserId,
  targetName,
  allyStatus,
  isFollowing,
  isFollowedBy,
  onAllyStatusChange,
  onFollowChange,
  onConversationReady,
}: RelationshipButtonsProps) {
  const [allyBusy, setAllyBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);

  const handleRemoveAlly = async () => {
    setAllyBusy(true);
    try {
      await apiClient.removeAlly(targetUserId);
      onAllyStatusChange('none');
    } catch (err: any) {
      notify.error('Could not remove ally', err?.message);
    } finally {
      setAllyBusy(false);
    }
  };

  const handleMessage = async () => {
    setMessageBusy(true);
    try {
      const conversationId = await chatService.getOrCreateConversation(targetUserId);
      onConversationReady?.(conversationId);
    } catch (err: any) {
      notify.error('Could not start conversation', err?.message);
    } finally {
      setMessageBusy(false);
    }
  };

  const handleToggleFollow = async () => {
    setFollowBusy(true);
    const next = !isFollowing;
    onFollowChange(next); // optimistic
    try {
      if (next) await apiClient.followUser(targetUserId);
      else await apiClient.unfollowUser(targetUserId);
    } catch (err: any) {
      onFollowChange(!next); // revert
      notify.error(next ? 'Could not follow' : 'Could not unfollow', err?.message);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Message action */}
      <button
        onClick={handleMessage}
        disabled={messageBusy}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#155a33] text-white font-jakarta text-sm font-semibold border border-transparent transition-colors disabled:opacity-60"
      >
        <MessageCircle size={14} /> Message
      </button>

      {/* Confirmed Allies badge & Remove dialog */}
      {allyStatus === 'allies' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={allyBusy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 font-jakarta text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-60"
            >
              <UserCheck size={14} /> Allies
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {targetName} as an ally?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to send a new request to become allies again. Your conversation history stays intact.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveAlly} className="bg-red-500 hover:bg-red-600">
                <UserMinus size={14} className="mr-1.5" /> Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Follow action */}
      <button
        onClick={handleToggleFollow}
        disabled={followBusy}
        className={
          isFollowing
            ? 'px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-jakarta text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60'
            : 'px-4 py-2 rounded-xl border-2 border-[#1A6B3C]/20 dark:border-emerald-500/30 text-[#1A6B3C] dark:text-emerald-400 font-jakarta text-sm font-semibold hover:border-[#1A6B3C]/40 dark:hover:border-emerald-500/50 hover:bg-[#1A6B3C]/5 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-60'
        }
      >
        {isFollowing ? 'Following' : isFollowedBy ? 'Follow Back' : 'Follow'}
      </button>
    </div>
  );
}
