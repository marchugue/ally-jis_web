import React from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  stageName,
  TOTAL_POINTS_FOR_PROFILE_UNLOCK,
} from '@/constants/roadmap';

export interface RoadmapCanvasProps {
  stage?: number;
  dayStreak?: number;
  matchPoints?: number;
  goalPoints?: number;
  effectiveMultiplier?: number;
  partnerAlias?: string;
  extraRightPadding?: boolean;
  onBackToChat: () => void;
  className?: string;
}

export const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  stage = 1,
  dayStreak = 0,
  matchPoints = 0,
  goalPoints = TOTAL_POINTS_FOR_PROFILE_UNLOCK,
  effectiveMultiplier = 1,
  extraRightPadding = false,
  onBackToChat,
  className,
}) => {
  const currentStage = Math.max(1, Math.min(4, stage));
  const progressPercent = Math.min(100, Math.max(0, (matchPoints / goalPoints) * 100));
  const isProfileUnlocked = matchPoints >= goalPoints;

  return (
    <div
      className={cn(
        'relative w-full h-full min-h-0 overflow-hidden select-none bg-[#5BD147]',
        className
      )}
    >
      {/* ── Responsive Roadmap Image Container ── */}
      <img
        src="/images/roadmap-bg.png"
        alt="Roadmap landscape"
        className="w-full h-full object-cover object-bottom sm:object-[center_bottom] md:object-bottom select-none pointer-events-none transition-all duration-300"
        draggable={false}
      />

      {/* ── FLOATING TOP HEADER ── */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 z-20 flex items-center justify-between gap-3 pointer-events-none transition-all">
        {/* Back to Chat button */}
        <button
          type="button"
          onClick={onBackToChat}
          className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md text-[#1A6B3C] dark:text-emerald-400 font-jakarta font-bold text-xs shadow-md border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#181818] active:scale-95 transition-all cursor-pointer"
          title="Return to messaging"
        >
          <ArrowLeft size={16} className="stroke-[2.5]" />
          <span>Back to Chat</span>
        </button>

        {/* Stage Title Badge */}
        <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md shadow-md border border-black/10 dark:border-white/10 select-none">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="font-jakarta font-black text-xs text-[#1A6B3C] dark:text-emerald-400 uppercase tracking-wide">
            Stage {currentStage} · {stageName(currentStage)}
          </span>
        </div>

        {/* Multiplier / Streak indicator */}
        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md font-mono font-bold text-xs select-none">
          <Flame size={14} className="fill-white" />
          <span>{effectiveMultiplier}× Multiplier</span>
        </div>
      </div>

      {/* ── FLOATING BOTTOM POINTS PROGRESSION BAR ── */}
      <div className="absolute bottom-5 inset-x-6 max-w-sm mx-auto z-20 pointer-events-auto">
        <div className="h-6 rounded-full bg-black/30 backdrop-blur-md border-[2.5px] border-white overflow-hidden relative flex items-center justify-center shadow-lg">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
              isProfileUnlocked
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                : 'bg-[#22C55E]'
            )}
            style={{ width: `${Math.max(progressPercent > 0 ? 5 : 0, progressPercent)}%` }}
          />
          <span className="relative z-10 text-xs font-black text-white font-mono tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {matchPoints}/{goalPoints}
          </span>
        </div>
      </div>
    </div>
  );
};
