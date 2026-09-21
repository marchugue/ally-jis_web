import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAnonymousAnimalAnimatedUrl } from '@/lib/fluentEmoji';
import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI } from '@/lib/matchOptions';

export interface FloatingStatusBadgeProps {
  stage?: number;
  dayStreak?: number;
  avatarKey?: string | null;
  onClick: () => void;
  className?: string;
  emojiSize?: number;
}

export interface StageProgression {
  currentStage: number;
  targetStage: number;
  currentStreak: number;
  targetStreak: number;
  stageStartStreak: number;
  progressPercent: number;
  isMaxStage: boolean;
  stageLabel: string;
  targetLabel: string;
}

export function calculateStageProgression(stage: number = 1, dayStreak: number = 0): StageProgression {
  const streakCalculatedStage =
    dayStreak >= 10 ? 4 : dayStreak >= 7 ? 3 : dayStreak >= 3 ? 2 : 1;
  const currentStage = Math.max(1, Math.min(4, Math.max(stage, streakCalculatedStage)));

  if (currentStage === 1) {
    const targetStreak = 3;
    const progressPercent = Math.max(0, Math.min(100, Math.round((dayStreak / targetStreak) * 100)));
    return {
      currentStage: 1,
      targetStage: 2,
      currentStreak: dayStreak,
      targetStreak,
      stageStartStreak: 0,
      progressPercent,
      isMaxStage: false,
      stageLabel: 'Lv.1',
      targetLabel: 'Lv.2',
    };
  }

  if (currentStage === 2) {
    const stageStartStreak = 3;
    const targetStreak = 7;
    const range = targetStreak - stageStartStreak; // 4
    const progressPercent = Math.max(0, Math.min(100, Math.round(((dayStreak - stageStartStreak) / range) * 100)));
    return {
      currentStage: 2,
      targetStage: 3,
      currentStreak: dayStreak,
      targetStreak,
      stageStartStreak,
      progressPercent,
      isMaxStage: false,
      stageLabel: 'Lv.2',
      targetLabel: 'Lv.3',
    };
  }

  if (currentStage === 3) {
    const stageStartStreak = 7;
    const targetStreak = 10;
    const range = targetStreak - stageStartStreak; // 3
    const progressPercent = Math.max(0, Math.min(100, Math.round(((dayStreak - stageStartStreak) / range) * 100)));
    return {
      currentStage: 3,
      targetStage: 4,
      currentStreak: dayStreak,
      targetStreak,
      stageStartStreak,
      progressPercent,
      isMaxStage: false,
      stageLabel: 'Lv.3',
      targetLabel: 'Lv.4',
    };
  }

  return {
    currentStage: 4,
    targetStage: 4,
    currentStreak: dayStreak,
    targetStreak: 10,
    stageStartStreak: 10,
    progressPercent: 100,
    isMaxStage: true,
    stageLabel: 'Lv.4',
    targetLabel: 'MAX',
  };
}

export const FloatingStatusBadge: React.FC<FloatingStatusBadgeProps> = ({
  stage = 1,
  dayStreak = 0,
  avatarKey,
  onClick,
  className,
  emojiSize = 63, // 1.5x scale (from 42px)
}) => {
  const [imgError, setImgError] = useState(false);
  const progression = calculateStageProgression(stage, dayStreak);
  
  // Prefer local downloaded asset in public/emojis/animals/, fallback to CDN
  const localUrl = avatarKey ? `/emojis/animals/${avatarKey.toLowerCase().trim()}.png` : `/emojis/animals/default.png`;
  const animatedUrl = imgError ? getAnonymousAnimalAnimatedUrl(avatarKey) : localUrl;
  const fallbackEmoji = (avatarKey && AVATAR_EMOJI[avatarKey]) || DEFAULT_AVATAR_EMOJI;

  const tooltipText = progression.isMaxStage
    ? `Stage 4: Campus Allies Unlocked! (100%) • Click to view Roadmap`
    : `Stage ${progression.currentStage} • Progress to ${progression.targetLabel}: ${progression.progressPercent}% (${progression.currentStreak}/${progression.targetStreak}d) • Click to view Roadmap`;

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
