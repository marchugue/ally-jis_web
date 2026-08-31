// src/components/profile/RelationshipButtons.tsx

import { useState } from 'react';
import { Check, Clock, MessageCircle, UserCheck, UserMinus, UserPlus, X } from 'lucide-react';
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

  const handleAddAlly = async () => {
    setAllyBusy(true);
    try {
      await apiClient.sendConnectionRequest(targetUserId);
      onAllyStatusChange('pending_outgoing');
    } catch (err: any) {
      notify.error('Could not send request', err?.message);
    } finally {
      setAllyBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    setAllyBusy(true);
    try {
      await apiClient.cancelConnectionRequest(targetUserId);
      onAllyStatusChange('none');
    } catch (err: any) {
      notify.error('Could not cancel request', err?.message);
    } finally {
      setAllyBusy(false);
    }
  };

  const handleAccept = async () => {
    setAllyBusy(true);
    try {
      const result = await apiClient.acceptConnection(targetUserId);
      onAllyStatusChange('allies');
      if (result?.conversationId) onConversationReady?.(result.conversationId);
    } catch (err: any) {
      notify.error('Could not accept request', err?.message);
    } finally {
      setAllyBusy(false);
    }
  };

  const handleReject = async () => {
    setAllyBusy(true);
    try {
      await apiClient.rejectConnection(targetUserId);
      onAllyStatusChange('none');
    } catch (err: any) {
      notify.error('Could not decline request', err?.message);
    } finally {
      setAllyBusy(false);
    }
  };

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
      {/* Ally action */}
      {allyStatus === 'none' && (
        <button
          onClick={handleAddAlly}
          disabled={allyBusy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-md disabled:opacity-60"
        >
          <UserPlus size={14} /> Add Ally
        </button>
      )}

      {allyStatus === 'pending_outgoing' && (
        <button
          onClick={handleCancelRequest}
          disabled={allyBusy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-jakarta text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <Clock size={14} /> Request Sent
        </button>
      )}

      {allyStatus === 'pending_incoming' && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleAccept}
            disabled={allyBusy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-md disabled:opacity-60"
          >
            <Check size={14} /> Accept
          </button>
          <button
            onClick={handleReject}
            disabled={allyBusy}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
            aria-label="Decline request"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {allyStatus === 'allies' && (
        <>
          <button
            onClick={handleMessage}
            disabled={messageBusy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-semibold hover:bg-[#155a33] transition-colors shadow-md disabled:opacity-60"
          >
            <MessageCircle size={14} /> Message
          </button>
          <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={allyBusy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-jakarta text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-60"
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
        </>
      )}

      {/* Follow action */}
      <button
        onClick={handleToggleFollow}
        disabled={followBusy}
        className={
          isFollowing
            ? 'px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-jakarta text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60'
            : 'px-4 py-2 rounded-xl border-2 border-[#1A6B3C]/20 text-[#1A6B3C] font-jakarta text-sm font-semibold hover:border-[#1A6B3C]/40 hover:bg-[#1A6B3C]/5 transition-colors disabled:opacity-60'
        }
      >
        {isFollowing ? 'Following' : isFollowedBy ? 'Follow Back' : 'Follow'}
      </button>
    </div>
  );
}
