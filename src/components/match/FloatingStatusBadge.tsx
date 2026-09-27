import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAnonymousAnimalAnimatedUrl } from '@/lib/fluentEmoji';
import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI } from '@/lib/matchOptions';

export interface FloatingStatusBadgeProps {
  stage?: number;
  dayStreak?: number;
  matchPoints?: number;
  stagePoints?: number;
  pointsPerStage?: number;
  profileUnlockTarget?: number;
  effectiveMultiplier?: number;
  avatarKey?: string | null;
  onClick: () => void;
  className?: string;
  emojiSize?: number;
}

export interface StageProgression {
  currentStage: number;
  targetStage: number;
  dayStreak: number;
  targetStreak: number;
  matchPoints: number;
  profileUnlockTarget: number;
  progressPercent: number;
  isMaxStage: boolean;
  isProfileUnlocked: boolean;
  stageLabel: string;
  targetLabel: string;
}

export function calculateStageProgression(
  stage: number = 1,
  matchPoints: number = 0,
  dayStreak: number = 0,
  profileUnlockTarget: number = 500,
): StageProgression {
  const currentStage = Math.max(1, Math.min(4, stage));
  const isProfileUnlocked = matchPoints >= profileUnlockTarget;
  const progressPercent = Math.max(0, Math.min(100, Math.round((matchPoints / profileUnlockTarget) * 100)));

  let targetStreak = 3;
  if (currentStage === 2) targetStreak = 7;
  else if (currentStage === 3) targetStreak = 10;
  else if (currentStage >= 4) targetStreak = 10;

  return {
    currentStage,
    targetStage: currentStage >= 4 ? 4 : currentStage + 1,
    dayStreak,
    targetStreak,
    matchPoints,
    profileUnlockTarget,
    progressPercent,
    isMaxStage: currentStage >= 4,
    isProfileUnlocked,
    stageLabel: `S${currentStage}`,
    targetLabel: currentStage >= 4 ? 'MAX' : `S${currentStage + 1}`,
  };
}

export const FloatingStatusBadge: React.FC<FloatingStatusBadgeProps> = ({
  stage = 1,
  dayStreak = 0,
  matchPoints = 0,
  stagePoints = 0,
  pointsPerStage = 500,
  profileUnlockTarget = 500,
  effectiveMultiplier = 1,
  avatarKey,
  onClick,
  className,
  emojiSize = 63,
}) => {
  const [imgError, setImgError] = useState(false);
  const currentPoints = matchPoints > 0 ? matchPoints : stagePoints;
  const targetPoints = profileUnlockTarget > 0 ? profileUnlockTarget : pointsPerStage;
  const progression = calculateStageProgression(stage, currentPoints, dayStreak, targetPoints);
  
  // Prefer local downloaded asset in public/emojis/animals/, fallback to CDN
  const localUrl = avatarKey ? `/emojis/animals/${avatarKey.toLowerCase().trim()}.png` : `/emojis/animals/default.png`;
  const animatedUrl = imgError ? getAnonymousAnimalAnimatedUrl(avatarKey) : localUrl;
  const fallbackEmoji = (avatarKey && AVATAR_EMOJI[avatarKey]) || DEFAULT_AVATAR_EMOJI;

  const tooltipText = progression.isProfileUnlocked
    ? `Profile Unlocked! • Stage ${progression.currentStage} (${dayStreak}d streak) • Click to view Roadmap`
    : `Stage ${progression.currentStage} (${dayStreak}d streak • ${effectiveMultiplier}× multiplier) • ${progression.matchPoints}/${progression.profileUnlockTarget} pts to Profile Unlock (${progression.progressPercent}%) • Click to view Roadmap`;

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
      {/* Animated Microsoft 3D Emoji (1.5x Scale) */}
      <div
        className="flex items-center justify-center relative select-none"
        style={{ width: emojiSize, height: emojiSize }}
      >
        <img
          src={animatedUrl}
          alt={fallbackEmoji}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none drop-shadow-md group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Progression / Level Bar Horizontally — width strictly matches emoji scale */}
      <div
        className="flex flex-col items-center gap-0.5"
        style={{ width: emojiSize }}
      >
        {/* Track & Filled Progress */}
        <div
          className="w-full h-[6px] bg-black/20 dark:bg-white/25 rounded-full overflow-hidden p-[0.5px]"
          role="progressbar"
          aria-valuenow={progression.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              progression.isMaxStage
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-[#1A6B3C] to-emerald-400 dark:from-emerald-400 dark:to-teal-300'
            )}
            style={{ width: `${Math.max(6, progression.progressPercent)}%` }}
          />
        </div>

        {/* Level text indicator */}
        <div className="flex items-center justify-between w-full px-0.5">
          <span className="text-[9.5px] font-mono font-extrabold text-[#1A6B3C] dark:text-emerald-400 leading-none">
            {progression.stageLabel}
          </span>
          <span className="text-[9px] font-mono font-bold text-gray-600 dark:text-gray-300 leading-none">
            {progression.isMaxStage ? 'MAX' : `${progression.progressPercent}%`}
          </span>
        </div>
      </div>
    </button>
  );
};

export const RoadmapProgressionBadge = FloatingStatusBadge;
