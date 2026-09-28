// src/components/roadmap/MobileRoadmapView.tsx
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Lock,
  Flame,
  Star,
  MessageCircle,
  Gamepad2,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STAGES,
  STAGE_STREAK_REQS,
  MASTER_DAILY_TASKS,
  stageName,
  TOTAL_POINTS_FOR_PROFILE_UNLOCK,
} from '@/constants/roadmap';
import type { DailyTaskStatus } from '@/api/types';

export interface MobileRoadmapViewProps {
  stage?: number;
  dayStreak?: number;
  matchPoints?: number;
  goalPoints?: number;
  effectiveMultiplier?: number;
  dailyTasks?: DailyTaskStatus[];
  partnerAlias?: string;
  onBack: () => void;
  className?: string;
}

const CARD_PEEK_VISIBLE_BASE = 130; // reveals progress bar + Daily Tasks header on initial load

export const MobileRoadmapView: React.FC<MobileRoadmapViewProps> = ({
  stage = 1,
  dayStreak = 0,
  matchPoints = 0,
  goalPoints = TOTAL_POINTS_FOR_PROFILE_UNLOCK,
  effectiveMultiplier = 1,
  dailyTasks = [],
  partnerAlias = 'Your match',
  onBack,
  className,
}) => {
  const currentStage = Math.max(1, Math.min(4, stage));
  const progressPercent = Math.min(100, Math.max(0, (matchPoints / goalPoints) * 100));
  const isProfileUnlocked = matchPoints >= goalPoints;

  const [screenW, setScreenW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 390
  );
  const [screenH, setScreenH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 844
  );

  useEffect(() => {
    const onResize = () => {
      setScreenW(window.innerWidth);
      setScreenH(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cardPeekTop = Math.max(180, screenH - CARD_PEEK_VISIBLE_BASE);

  const tasksToDisplay = MASTER_DAILY_TASKS.map((def) => {
    const serverTask = dailyTasks.find((t) => t.taskId === def.taskId);
    const isAvailable = currentStage >= def.unlockedAtStage;
    const isDone =
      isAvailable &&
      (serverTask ? serverTask.myCompleted && serverTask.partnerCompleted : false);
    const basePoints = serverTask?.basePoints ?? def.basePoints;
    const myDone = Boolean(serverTask?.myCompleted);
    const partnerDone = Boolean(serverTask?.partnerCompleted);

    return {
      ...def,
      basePoints,
      isAvailable,
      isDone,
      myDone,
      partnerDone,
    };
  });

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-[#16A34A] flex flex-col overflow-hidden select-none animate-in fade-in duration-200',
        className
      )}
    >
      {/* ── SECTION 1: Full-Bleed Road Background (Responsive, bottom-anchored) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <img
          src="/images/roadmap-bg.png"
          alt="Road Background"
          className="w-full h-full object-cover object-bottom select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ── SECTION 2: Scrollable Layer (Reveals bottom info card) ── */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ paddingTop: cardPeekTop }}>
          {/* Points progression bar on top of card */}
          <div className="mx-6 mb-3 shadow-md">
            <div className="h-6 rounded-full bg-black/30 backdrop-blur-md border-[2.5px] border-white overflow-hidden relative flex items-center justify-center">
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

          {/* The entire white card */}
          <div className="bg-white dark:bg-[#121824] rounded-t-[28px] pt-6 px-5 pb-12 shadow-2xl space-y-6 w-full">
            {/* Daily Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500" />
                  Daily Tasks
                </span>
                <span className="text-[10px] font-mono text-gray-400">Resets 12:00 AM PHT</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {tasksToDisplay.map((task) => (
                  <div
                    key={task.taskId}
                    className={cn(
                      'flex items-center gap-3 py-3.5',
                      !task.isAvailable && 'opacity-55'
                    )}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {!task.isAvailable ? (
                        <Lock size={18} className="text-gray-400 stroke-[2]" />
                      ) : task.isDone ? (
                        <CheckCircle2 size={22} className="text-emerald-600 stroke-[2.4]" />
                      ) : (
                        <Circle size={22} className="text-gray-300 dark:text-gray-600 stroke-[2]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          'text-sm font-bold font-jakarta leading-tight truncate',
                          task.isDone
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : !task.isAvailable
                            ? 'text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {task.label}
                      </h4>
                      <p
                        className={cn(
                          'text-xs mt-0.5 leading-snug',
                          !task.isAvailable ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {!task.isAvailable
                          ? `Unlocks at Stage ${task.unlockedAtStage} · ${stageName(task.unlockedAtStage)}`
                          : task.description}
                      </p>
                      {task.isAvailable && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-gray-400">
                            You: {task.myDone ? '✓' : '○'} · {partnerAlias}: {task.partnerDone ? '✓' : '○'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-sm font-black font-mono',
                          task.isDone
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : !task.isAvailable
                            ? 'text-gray-400'
                            : 'text-[#1A6B3C] dark:text-emerald-400'
                        )}
                      >
                        +{Math.round(task.basePoints * effectiveMultiplier)}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Milestones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Flame size={13} className="text-orange-500" />
                  Streak Milestones
                </span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {dayStreak}d Current Streak
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                {STAGES.map((s, idx) => {
                  const reqDays = STAGE_STREAK_REQS[s];
                  const unlocked = dayStreak >= reqDays;
                  const nextReqDays = STAGE_STREAK_REQS[s + 1] ?? 999;
                  const isConnectorActive = idx < STAGES.length - 1 && dayStreak >= nextReqDays;

                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center w-12 shrink-0">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-full flex items-center justify-center mb-1.5 shadow-2xs',
                            unlocked
                              ? 'bg-amber-100 dark:bg-amber-950/50 border-2 border-amber-500'
                              : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                          )}
                        >
                          {unlocked ? (
                            <span className="text-lg">🔥</span>
                          ) : (
                            <div className="relative flex items-center justify-center">
                              <span className="text-base opacity-20">🔥</span>
                              <div className="absolute -bottom-1 -right-1 bg-gray-200 dark:bg-neutral-700 rounded-full p-0.5">
                                <Lock size={8} className="text-gray-500 stroke-[2.5]" />
                              </div>
                            </div>
                          )}
                        </div>

                        <span
                          className={cn(
                            'text-xs font-black font-mono',
                            unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                          )}
                        >
                          {reqDays}d
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold',
                            unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                          )}
                        >
                          S{s}
                        </span>
                      </div>

                      {idx < STAGES.length - 1 && (
                        <div
                          className={cn(
                            'flex-1 h-0.5 mx-1 self-start mt-5 transition-colors',
                            isConnectorActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-neutral-700'
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Controls (Always on top, clickable) ── */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-3 left-4 w-10 h-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md flex items-center justify-center shadow-lg border border-black/10 dark:border-white/10 z-30 cursor-pointer active:scale-95 transition-transform"
        aria-label="Back to chat"
      >
        <ChevronLeft size={22} className="text-[#1A6B3C] dark:text-emerald-400 stroke-[2.5]" />
      </button>

      <div className="absolute top-3 inset-x-0 mx-auto w-max z-30 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-lg border border-black/10 dark:border-white/10 select-none">
        <span className="font-jakarta font-extrabold text-xs text-[#1A6B3C] dark:text-emerald-400">
          Stage {currentStage} · {stageName(currentStage)}
        </span>
      </div>
    </div>
  );
};
