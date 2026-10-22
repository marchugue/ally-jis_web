// src/components/chat/GameInviteCard.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import type { GameInvitePayload } from '@/types/ally';
import { cn } from '@/lib/utils';

interface GameInviteCardProps {
  invite: GameInvitePayload;
  isMe: boolean;
  currentUserId: string;
}

const GAME_META: Record<
  'merge' | 'ttt' | 'clue',
  {
    title: string;
    cover: string;
  }
> = {
  merge: {
    title: '2048 Merge',
    cover: '/game-merge-cover.jpg',
  },
  ttt: {
    title: 'Tic-Tac-Toe',
    cover: '/game-ttt-cover.jpg',
  },
  clue: {
    title: 'Secret Clue',
    cover: '/game-clue-cover.jpg',
  },
};

export const GameInviteCard: React.FC<GameInviteCardProps> = ({ invite, isMe, currentUserId }) => {
  const [submitting, setSubmitting] = useState(false);
  const meta = GAME_META[invite.gameId] || GAME_META.ttt;

  // Authoritative host / guest determination
  const isHost = isMe || (invite.hostId && invite.hostId === currentUserId);
  const isGuest = !isMe || (invite.guestId && invite.guestId === currentUserId);

  // Normalize backend status ('invited', 'pending', 'active', etc.)
  const rawStatus = (invite.status || 'pending').toLowerCase();
  const isPending = rawStatus === 'pending' || rawStatus === 'invited';
  const isActive = rawStatus === 'active';
  const isFinished = rawStatus === 'finished';
  const isDeclined = rawStatus === 'declined' || rawStatus === 'cancelled';
  const isExpired = rawStatus === 'expired';

  const openGamePortal = (sessionId?: string) => {
    const isProd =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('ally-jis.com') ||
        window.location.hostname.endsWith('ally-jis.xyz') ||
        import.meta.env.PROD);
    const baseGameUrl = isProd
      ? 'https://game.ally-jis.com'
      : (import.meta.env.VITE_GAME_URL as string) || 'http://localhost:5174';
    const token = apiClient.getAccessToken();

    const params = new URLSearchParams();
    if (sessionId) params.set('session', sessionId);
    if (token) params.set('token', token);

    const qs = params.toString();
    const fullUrl = `${baseGameUrl}${qs ? `?${qs}` : ''}`;
    window.open(fullUrl, '_blank');
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      if (invite.sessionId) {
        await apiClient.acceptGameInvite(invite.sessionId);
      }
      toast.success('Accepted! Launching duel room…');
      openGamePortal(invite.sessionId);
    } catch (err: any) {
      toast.error(err?.message || 'Could not accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      if (invite.sessionId) {
        await apiClient.declineGameInvite(invite.sessionId);
      }
      toast.info('Invite declined');
    } catch (err: any) {
      toast.error(err?.message || 'Could not decline invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      if (invite.sessionId) {
        await apiClient.cancelGameInvite(invite.sessionId);
      }
      toast.info('Invite cancelled');
    } catch (err: any) {
      toast.error(err?.message || 'Could not cancel invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    openGamePortal(invite.sessionId);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative w-[250px] sm:w-[270px] aspect-square rounded-[22px] sm:rounded-[24px] p-4 my-1 text-left select-none shadow-2xl transition-all border border-white/15 hover:border-white/30 overflow-hidden flex flex-col justify-between group'
      )}
    >
      {/* ═══ Full Bleed Background Image ═══ */}
      <img
        src={meta.cover}
        alt={meta.title}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
      />

      {/* ═══ Gradient Overlay for Readability ═══ */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#060c14]/95 via-[#060c14]/65 via-50% to-[#060c14]/35 pointer-events-none"
        aria-hidden="true"
      />

      {/* ═══ Top Section: Game Title Tag & Status Badge ═══ */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="px-2.5 py-1 rounded-xl bg-black/65 backdrop-blur-md text-xs font-bold text-white tracking-wide border border-white/10 shadow-sm">
          {meta.title}
        </div>

        <span
          className={cn(
            'text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs border',
            isPending && 'bg-amber-500/80 text-white border-amber-400/40 animate-pulse',
            isActive && 'bg-emerald-500/90 text-white border-emerald-400/40',
            isFinished && 'bg-blue-500/80 text-white border-blue-400/40',
            isDeclined && 'bg-rose-500/80 text-white border-rose-400/40',
            isExpired && 'bg-stone-600/80 text-stone-200 border-stone-500/40'
          )}
        >
          {isPending ? 'Invited' : isActive ? 'Live' : isFinished ? 'Over' : isDeclined ? 'Declined' : 'Expired'}
        </span>
      </div>

      {/* ═══ Bottom Section: Short Invite Message & Buttons ═══ */}
      <div className="relative z-10 flex flex-col gap-2.5 pt-4">
        {/* Short Invite Message */}
        <div className="px-0.5">
          {isPending ? (
            isGuest ? (
              <p className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-tight">
                Challenged you to play!
              </p>
            ) : (
              <p className="text-xs font-medium text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-tight">
                Waiting for opponent to accept...
              </p>
            )
          ) : isActive ? (
            <p className="text-xs font-semibold text-[#38C185] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-tight">
              Duel is underway! Rejoin anytime.
            </p>
          ) : isFinished ? (
            <p className="text-xs font-medium text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-tight">
              Match concluded.
            </p>
          ) : (
            <p className="text-xs text-stone-300 italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-tight">
              Invite expired or declined.
            </p>
          )}
        </div>

        {/* Action Buttons (No Icons) */}
        <div>
          {isPending && (
            <>
              {isGuest ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleAccept}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38C185] to-[#42d494] hover:brightness-105 text-[#05180f] font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-center shadow-[0_0_15px_rgba(56,193,133,0.3)]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDecline}
                    className="py-2.5 px-3 rounded-xl bg-black/45 hover:bg-rose-500/25 hover:text-rose-200 hover:border-rose-500/40 text-stone-200 text-xs border border-white/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-center"
                  >
                    Decline
                  </button>
                </div>
              ) : isHost ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleEnterRoom}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38C185] to-[#42d494] hover:brightness-105 text-[#05180f] font-bold text-xs transition-all active:scale-95 cursor-pointer text-center shadow-[0_0_15px_rgba(56,193,133,0.3)]"
                  >
                    Enter Room
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCancel}
                    className="py-2.5 px-3 rounded-xl bg-black/45 hover:bg-white/20 text-stone-200 text-xs border border-white/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </>
          )}

          {isActive && (
            <button
              type="button"
              onClick={handleEnterRoom}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#05180f] font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer text-center"
            >
              Resume
            </button>
          )}

          {(isFinished || isDeclined || isExpired) && (
            <button
              type="button"
              onClick={handleEnterRoom}
              className="w-full py-2.5 px-3 rounded-xl bg-black/45 hover:bg-white/20 text-stone-200 text-xs border border-white/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer text-center"
            >
              Open Arena
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
