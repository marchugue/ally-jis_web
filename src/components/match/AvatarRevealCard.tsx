// src/components/match/AvatarRevealCard.tsx
//
// Hero card for the roadmap panels: the progressive reveal avatar plus
// the current tier label and "next tier at X pts" guidance.

import React from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { REVEAL_TIER_META } from '@/lib/avatarReveal';
import { RevealAvatar } from './RevealAvatar';
import type { AvatarRevealView } from '@/api/types';

export interface AvatarRevealCardProps {
  reveal: AvatarRevealView | null | undefined;
  avatarKey?: string | null;
  partnerAlias?: string | null;
  partnerName?: string | null;
  size?: number;
  /** 'light' for white panels, 'glass' for overlays on coloured backgrounds. */
  tone?: 'light' | 'glass';
  className?: string;
}

export const AvatarRevealCard: React.FC<AvatarRevealCardProps> = ({
  reveal,
  avatarKey,
  partnerAlias,
  partnerName,
  size = 104,
  tone = 'light',
  className,
}) => {
  const tier = reveal?.tier ?? 0;
  const meta = REVEAL_TIER_META[tier] ?? REVEAL_TIER_META[0];
  const target = reveal?.target ?? 250;
  const points = reveal?.matchPoints ?? 0;
  const percent = Math.round((reveal?.progress ?? 0) * 100);
  const isRevealed = tier >= 5;
  const toNext = Math.max(0, (reveal?.tierEnd ?? target) - points);
  const who = partnerAlias || 'your ally';

  const handleTierUp = React.useCallback(
    (t: number) => {
      if (t >= 5) return; // ceremony handles the final moment
      toast(`${who} is coming into focus · ${Math.round(((reveal?.tierThresholds?.[t] ?? 0) / target) * 100)}%`, {
        description: REVEAL_TIER_META[t]?.hint,
      });
    },
    [who, reveal?.tierThresholds, target],
  );

  const glass = tone === 'glass';

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl p-4',
        glass
          ? 'bg-black/25 backdrop-blur-md border-2 border-white/70 text-white'
          : 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#0D131F] border border-emerald-100 dark:border-emerald-900/40',
        className,
      )}
    >
      <RevealAvatar
        reveal={reveal}
        avatarKey={avatarKey}
        size={size}
        fallbackInitials={partnerName ?? partnerAlias}
        onTierUp={handleTierUp}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[10px] font-extrabold uppercase tracking-[0.8px]',
            glass ? 'text-white/80' : 'text-[#475569] dark:text-[#94A3B8]',
          )}
        >
          Avatar reveal · {meta.label}
        </p>
        <h4
          className={cn(
            'font-jakarta font-black text-base leading-tight mt-0.5 truncate',
            glass ? 'text-white' : 'text-[#0F172A] dark:text-white',
          )}
        >
          {isRevealed ? partnerName || 'Revealed!' : `${percent}% revealed`}
        </h4>
        <p className={cn('text-xs mt-1 leading-snug', glass ? 'text-white/85' : 'text-[#64748B] dark:text-gray-400')}>
          {isRevealed
            ? 'You both unlocked each other’s real profile.'
            : reveal && !reveal.hasPhoto
              ? `${who} hasn't added a photo yet. Their initials will show when you reach ${target} pts.`
              : `${meta.hint} · next reveal in ${toNext} pt${toNext === 1 ? '' : 's'}`}
        </p>
        {!isRevealed && (
          <div className="mt-2 flex gap-1" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-500',
                  i < tier
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : glass
                      ? 'bg-white/30'
                      : 'bg-gray-200 dark:bg-white/10',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarRevealCard;
