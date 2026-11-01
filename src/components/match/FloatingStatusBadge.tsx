import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCrittersAvatarDataUri, getCrittersHttpUrl } from '@/lib/dicebearCritters';
import { avatarColorFor } from '@/lib/matchOptions';
import type { AvatarRevealView } from '@/api/types';

export interface FloatingStatusBadgeProps {
  stage?: number;
  dayStreak?: number;
  targetStreak?: number;
  matchPoints?: number;
  stagePoints?: number;
  pointsPerStage?: number;
  profileUnlockTarget?: number;
  progressPercent?: number;
  isProfileUnlocked?: boolean;
  isMaxStage?: boolean;
  effectiveMultiplier?: number;
  avatarKey?: string | null;
  onClick: () => void;
  className?: string;
  emojiSize?: number;
  /** When provided and tier ≥ 1, the partner's photo starts showing through. */
  avatarReveal?: AvatarRevealView | null;
}

export const FloatingStatusBadge: React.FC<FloatingStatusBadgeProps> = ({
  stage = 1,
  dayStreak = 0,
  matchPoints = 0,
  stagePoints = 0,
  pointsPerStage,
  profileUnlockTarget,
  progressPercent: serverProgressPercent,
  isProfileUnlocked: serverIsProfileUnlocked,
  isMaxStage: serverIsMaxStage,
  effectiveMultiplier = 1,
  avatarKey,
  onClick,
  className,
  emojiSize = 63,
}) => {
  const [imgError, setImgError] = useState(false);
  const currentStage = Math.max(1, Math.min(4, stage));
  const currentPoints = matchPoints > 0 ? matchPoints : stagePoints;
  const targetPoints = profileUnlockTarget ?? pointsPerStage ?? 0;
  const progressPercent =
    serverProgressPercent ??
    (targetPoints > 0 ? Math.max(0, Math.min(100, Math.round((currentPoints / targetPoints) * 100))) : 0);
  const isProfileUnlocked =
    serverIsProfileUnlocked ?? Boolean(targetPoints > 0 && currentPoints >= targetPoints);
  const isMaxStage = serverIsMaxStage ?? currentStage >= 4;
  const stageLabel = `S${currentStage}`;

  const bg = avatarColorFor(avatarKey);
  const avatarSrc = imgError
    ? getCrittersHttpUrl(avatarKey, bg)
    : getCrittersAvatarDataUri(avatarKey, bg, emojiSize);

  const tooltipText = isProfileUnlocked
    ? `Profile Unlocked! • Stage ${currentStage} (${dayStreak}d streak) • Click to view Roadmap`
    : `Stage ${currentStage} (${dayStreak}d streak • ${effectiveMultiplier}× multiplier) • ${targetPoints > 0 ? `${currentPoints}/${targetPoints} pts to Profile Unlock (${progressPercent}%)` : `${currentPoints} pts`} • Click to view Roadmap`;

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'group absolute top-3 right-3 sm:right-4 z-20 flex flex-col items-center gap-1.5 p-0 bg-transparent border-0',
        'hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none',
        className
      )}
      title={tooltipText}
      aria-label="Open Ally Roadmap & Progression"
    >
      {/* Critters Avatar with gentle float animation on hover */}
      <div
        className="flex items-center justify-center relative select-none group-hover:scale-110 transition-transform duration-300 rounded-full overflow-hidden shadow-md"
        style={{ width: emojiSize, height: emojiSize, border: `2px solid ${bg}` }}
      >
        <img
          src={avatarSrc}
          alt={avatarKey || 'Roadmap'}
          className="w-full h-full object-cover pointer-events-none select-none"
          loading="eager"
          decoding="async"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Progression / Level Bar Horizontally — width strictly matches emoji scale */}
      <div
        className="flex flex-col items-center gap-0.5"
        style={{ width: emojiSize }}
      >
        <div
          className="w-full h-[6px] bg-black/20 dark:bg-white/25 rounded-full overflow-full overflow-hidden p-[0.5px]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              isProfileUnlocked
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-[#1A6B3C] to-emerald-400 dark:from-emerald-400 dark:to-teal-300'
            )}
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full px-0.5">
          <span className="text-[9.5px] font-mono font-extrabold text-[#1A6B3C] dark:text-emerald-400 leading-none">
            {stageLabel}
          </span>
          <span className="text-[9px] font-mono font-bold text-gray-600 dark:text-gray-300 leading-none">
            {isProfileUnlocked ? 'MAX' : `${progressPercent}%`}
          </span>
        </div>
      </div>
    </button>
  );
};

export const RoadmapProgressionBadge = FloatingStatusBadge;
