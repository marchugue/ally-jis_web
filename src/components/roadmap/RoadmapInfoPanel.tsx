// src/components/roadmap/RoadmapInfoPanel.tsx
import React from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AvatarRevealView, DailyTaskStatus, StreakMilestoneInfo } from '@/api/types';

export interface RoadmapInfoPanelProps {
  stage?: number;
  stageName?: string;
  dayStreak?: number;
  matchPoints?: number;
  effectiveMultiplier?: number;
  dailyTasks?: DailyTaskStatus[];
  streakMilestones?: StreakMilestoneInfo[];
  partnerAlias?: string;
  /** Progressive real-avatar reveal state from the reveal endpoint. */
  avatarReveal?: AvatarRevealView | null;
  partnerAvatarKey?: string | null;
  partnerName?: string | null;
  onClose: () => void;
  className?: string;
}

export const RoadmapInfoPanel: React.FC<RoadmapInfoPanelProps> = ({
  stage = 1,
  stageName,
  dailyTasks = [],
  streakMilestones = [],
  partnerAlias,
  onClose,
  className,
}) => {
  const currentStage = Math.max(1, Math.min(4, stage));
  const resolvedStageName =
    stageName ||
    streakMilestones.find((m) => m.stage === currentStage)?.stageName ||
    'Anonymous Chat';

  return (
    <div
      className={cn(
        'w-full h-full bg-white dark:bg-[#0D131F] flex flex-col overflow-hidden select-none',
        className
      )}
    >
      {/* ── HEADER ── */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3 flex-shrink-0 bg-white/95 dark:bg-[#0D131F]/95 backdrop-blur-md sticky top-0 z-10 rounded-tl-[28px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-500/20 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Compass size={18} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-jakarta font-bold text-sm text-gray-900 dark:text-white leading-tight">
              Roadmap Progression
            </h3>
            <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5">
              Stage {currentStage} · {resolvedStageName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="Close roadmap info"
          title="Close roadmap panel"
        >
          <X size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* ── CARD CONTENT (Backend-driven Daily Tasks & Streak Milestones) ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7 custom-scrollbar">
        {/* ── Daily Tasks ── */}
        <div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#475569] dark:text-[#94A3B8] mb-3">
            Daily Tasks
          </h3>

          <div>
            {dailyTasks.map((task, idx) => {
              const isDone = Boolean(task.isCompleted ?? (task.myCompleted && task.partnerCompleted));
              return (
                <React.Fragment key={task.taskId}>
                  <div className="flex items-center py-3.5 gap-3">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={22} color="#16A34A" strokeWidth={2.2} />
                      ) : (
                        <Circle size={22} color="#CBD5E1" strokeWidth={2} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          'text-sm font-bold font-jakarta leading-tight truncate',
                          isDone
                            ? 'text-[#16A34A]'
                            : 'text-[#0F172A] dark:text-white'
                        )}
                      >
                        {task.label}
                      </h4>
                      <p className="text-xs leading-[17px] mt-0.5 text-[#64748B] dark:text-gray-400">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-gray-400">
                          You: {task.myCompleted ? '✓' : '○'} · {partnerAlias || 'Partner'}: {task.partnerCompleted ? '✓' : '○'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-sm font-extrabold font-mono',
                          isDone
                            ? 'text-[#16A34A]'
                            : 'text-[#1A6B3C] dark:text-emerald-400'
                        )}
                      >
                        +{task.points}
                      </span>
                      <p className="text-[10px] font-mono text-[#94A3B8]">
                        pts
                      </p>
                    </div>
                  </div>
                  {idx < dailyTasks.length - 1 && (
                    <div className="h-px bg-[#F1F5F9] dark:bg-white/5 ml-10" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Streak Milestones ── */}
        {streakMilestones.length > 0 && (
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#475569] dark:text-[#94A3B8] mb-3">
              Streak Milestones
            </h3>

            <div className="flex items-center justify-between py-3.5 px-1">
              {streakMilestones.map((milestone, idx) => {
                const nextMilestone = streakMilestones[idx + 1];
                const isConnectorActive = Boolean(nextMilestone?.unlocked);

                return (
                  <React.Fragment key={milestone.stage}>
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all',
                          milestone.unlocked
                            ? 'bg-[#FEF3C7] border-[1.5px] border-[#F59E0B] shadow-[0_2px_4px_rgba(245,158,11,0.18)]'
                            : 'bg-[#F1F5F9] dark:bg-neutral-800 border-[1.5px] border-[#E2E8F0] dark:border-neutral-700'
                        )}
                      >
                        {milestone.unlocked ? (
                          <span className="text-[21px]">🔥</span>
                        ) : (
                          <div className="relative flex items-center justify-center">
                            <span className="text-[19px] opacity-25">🔥</span>
                            <div className="absolute -bottom-1 -right-1.5 bg-[#E2E8F0] dark:bg-neutral-700 rounded-md p-[2px]">
                              <Lock size={9} color="#64748B" strokeWidth={2.5} />
                            </div>
                          </div>
                        )}
                      </div>

                      <span
                        className={cn(
                          'text-xs font-extrabold font-mono',
                          milestone.unlocked
                            ? 'text-[#0F172A] dark:text-white'
                            : 'text-[#94A3B8]'
                        )}
                      >
                        {milestone.thresholdDays}d
                      </span>
                    </div>

                    {idx < streakMilestones.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-[2px] mx-1.5 self-start mt-5 transition-colors',
                          isConnectorActive
                            ? 'bg-[#16A34A]'
                            : 'bg-[#E2E8F0] dark:bg-neutral-700'
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
