// src/components/chat/GameInviteCard.tsx

import React, { useState } from 'react';
import { Swords, Trophy, Clock, X, Check, ExternalLink, Sparkles, Hash, Search } from 'lucide-react';
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
    tagline: string;
    icon: React.ReactNode;
    cardGradient: string;
    accentBorder: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  merge: {
    title: '2048: Number Merge',
    tagline: 'Timed speed & merge race',
    icon: <Hash className="w-5 h-5 text-amber-400" />,
    cardGradient: 'from-amber-950/40 via-amber-900/20 to-stone-900/50',
    accentBorder: 'border-amber-500/40 hover:border-amber-400/60',
    badgeBg: 'bg-amber-500/20 border-amber-500/40',
    badgeText: 'text-amber-300',
  },
  ttt: {
    title: 'Tic-Tac-Toe',
    tagline: 'Turn-based tactical duel',
    icon: <Swords className="w-5 h-5 text-emerald-400" />,
    cardGradient: 'from-emerald-950/40 via-teal-900/20 to-stone-900/50',
    accentBorder: 'border-emerald-500/40 hover:border-emerald-400/60',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/40',
    badgeText: 'text-emerald-300',
  },
  clue: {
    title: 'Secret Clue',
    tagline: 'Clue giver & guesser duel',
    icon: <Search className="w-5 h-5 text-purple-400" />,
    cardGradient: 'from-purple-950/40 via-indigo-900/20 to-stone-900/50',
    accentBorder: 'border-purple-500/40 hover:border-purple-400/60',
    badgeBg: 'bg-purple-500/20 border-purple-500/40',
    badgeText: 'text-purple-300',
  },
};

export const GameInviteCard: React.FC<GameInviteCardProps> = ({ invite, currentUserId }) => {
  const [submitting, setSubmitting] = useState(false);
  const meta = GAME_META[invite.gameId] || GAME_META.ttt;
  const isHost = invite.hostId === currentUserId;
  const isGuest = invite.guestId === currentUserId;

  const openGamePortal = (sessionId: string) => {
    const isProd =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('ally-jis.com') ||
        window.location.hostname.endsWith('ally-jis.xyz') ||
        import.meta.env.PROD);
    const baseGameUrl = isProd
      ? 'https://game.ally-jis.com'
      : (import.meta.env.VITE_GAME_URL as string) || 'http://localhost:5174';
    const token = apiClient.getAccessToken();
    const fullUrl = token
      ? `${baseGameUrl}?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`
      : `${baseGameUrl}?session=${encodeURIComponent(sessionId)}`;

    window.open(fullUrl, '_blank');
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      await apiClient.acceptGameInvite(invite.sessionId);
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
      await apiClient.declineGameInvite(invite.sessionId);
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
      await apiClient.cancelGameInvite(invite.sessionId);
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
        'w-[270px] sm:w-[290px] rounded-2xl p-3.5 my-1 text-left select-none shadow-lg transition-all border backdrop-blur-md relative overflow-hidden',
        'bg-gradient-to-b bg-stone-900/90 text-stone-100',
        meta.cardGradient,
        meta.accentBorder
      )}
    >
      {/* Top Banner: Game Icon + Game Name + Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-stone-100 truncate tracking-wide font-medieval leading-tight">
              {meta.title}
            </h4>
            <p className="text-[10px] text-stone-400 truncate leading-tight mt-0.5">
              {meta.tagline}
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <span
          className={cn(
            'text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0',
            invite.status === 'pending' && 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
            invite.status === 'active' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            invite.status === 'finished' && 'bg-blue-500/20 text-blue-300 border-blue-500/40',
            invite.status === 'declined' && 'bg-red-500/20 text-red-300 border-red-500/40',
            invite.status === 'expired' && 'bg-stone-700/40 text-stone-400 border-stone-600/40'
          )}
        >
          {invite.status === 'pending'
            ? 'Invited'
            : invite.status === 'active'
            ? 'Live'
            : invite.status === 'finished'
            ? 'Over'
            : invite.status}
        </span>
      </div>

      {/* Center Description / Callout */}
      <div className="bg-black/30 rounded-xl p-2.5 mb-3 border border-white/5 text-[11px] leading-relaxed">
        {invite.status === 'pending' && (
          <div>
            {isGuest ? (
              <p className="text-stone-200">
                You were challenged to a duel! Accept to jump into the arena.
              </p>
            ) : isHost ? (
              <p className="text-stone-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Waiting for your ally to accept…</span>
              </p>
            ) : (
              <p className="text-stone-300">A duel was initiated.</p>
            )}
          </div>
        )}

        {invite.status === 'active' && (
          <p className="text-emerald-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Duel is currently underway! Enter to play.</span>
          </p>
        )}

        {invite.status === 'finished' && (
          <p className="text-stone-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Match concluded. Points recorded on leaderboard!</span>
          </p>
        )}

        {invite.status === 'declined' && (
          <p className="text-stone-400 italic">This challenge was declined.</p>
        )}

        {invite.status === 'expired' && (
          <p className="text-stone-400 italic">This invitation expired.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {invite.status === 'pending' && (
          <>
            {isGuest && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAccept}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Play</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDecline}
                  className="py-1.5 px-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 text-xs border border-white/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Decline"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {isHost && (
              <>
                <button
                  type="button"
                  onClick={handleEnterRoom}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-900 font-bold text-xs shadow-md shadow-amber-950/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Enter Room</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCancel}
                  className="py-1.5 px-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-400 text-xs border border-white/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Cancel invite"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </>
        )}

        {invite.status === 'active' && (
          <button
            type="button"
            onClick={handleEnterRoom}
            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Resume Duel</span>
          </button>
        )}

        {invite.status === 'finished' && (
          <button
            type="button"
            onClick={handleEnterRoom}
            className="w-full py-1.5 px-3 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 text-xs border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Game Arena</span>
          </button>
        )}

        {(invite.status === 'declined' || invite.status === 'expired') && (
          <button
            type="button"
            onClick={handleEnterRoom}
            className="w-full py-1.5 px-3 rounded-xl bg-stone-800/40 hover:bg-stone-800/70 text-stone-400 text-xs border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visit Arena</span>
          </button>
        )}
      </div>
    </div>
  );
};
