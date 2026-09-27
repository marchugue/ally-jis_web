import React, { useState } from 'react';
import {
  X,
  Compass,
  Flame,
  ArrowRight,
  MessageCircle,
  Gamepad2,
  Image,
  Users,
  Star,
  CheckCircle2,
  Circle,
  Lock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DailyTaskStatus {
  taskId: string;
  label: string;
  description: string;
  basePoints: number;
  myCompleted: boolean;
  partnerCompleted: boolean;
  myPointsAwarded: number;
}

interface MatchRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage?: number;
  dayStreak?: number;
  stagePoints?: number;
  matchPoints?: number;
  effectiveMultiplier?: number;
  dailyTasks?: DailyTaskStatus[];
  partnerAlias?: string | null;
  matchId?: string | null;
}

interface RoadmapStage {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  thresholdDays: number;
  multiplier: number;
  tasks: { id: string; label: string; basePts: number }[];
  icon: React.ElementType;
  color: string;
}

const ROADMAP_STAGES: RoadmapStage[] = [
  {
    id: 1,
    tag: 'STAGE 1 • 0 DAYS',
    title: 'Anonymous Chat',
    subtitle: '1× Point Multiplier',
    description: 'Chat anonymously and break the ice. Both users sending a message starts your streak and earns daily points toward unlocking profiles!',
    thresholdDays: 0,
    multiplier: 1,
    tasks: [
      { id: 'send_message', label: 'Send 1 message each', basePts: 1 },
    ],
    icon: MessageCircle,
    color: 'blue',
  },
  {
    id: 2,
    tag: 'STAGE 2 • 3-DAY STREAK',
    title: 'Play Together',
    subtitle: '2× Point Multiplier',
    description: 'Play mini-games together (5+ min) and unlock partner clues (age range, zodiac, department). Multiplier doubles all task rewards!',
    thresholdDays: 3,
    multiplier: 2,
    tasks: [
      { id: 'send_message', label: 'Send 1 message each', basePts: 1 },
      { id: 'play_game', label: 'Play game ≥5 min together', basePts: 2 },
    ],
    icon: Gamepad2,
    color: 'purple',
  },
  {
    id: 3,
    tag: 'STAGE 3 • 7-DAY STREAK',
    title: 'Media Sharing',
    subtitle: '3× Point Multiplier',
    description: 'Unlocks photo sharing in chat and partner hobby clues. Earn 3× points on all daily tasks to fast-track your 500-pt profile unlock!',
    thresholdDays: 7,
    multiplier: 3,
    tasks: [
      { id: 'send_message', label: 'Send 1 message each', basePts: 1 },
      { id: 'play_game', label: 'Play game ≥5 min together', basePts: 2 },
      { id: 'send_photo', label: 'Share 1 photo each', basePts: 3 },
    ],
    icon: Image,
    color: 'orange',
  },
  {
    id: 4,
    tag: 'STAGE 4 • 10-DAY STREAK',
    title: 'Campus Allies',
    subtitle: '4× Point Multiplier • Feed Unlocked',
    description: "Your feeds are now visible to each other in the Allies newsfeed filter (still anonymous). Real names & profiles unlock when you reach 500 total points!",
    thresholdDays: 10,
    multiplier: 4,
    tasks: [
      { id: 'send_message', label: 'Send 1 message each', basePts: 1 },
      { id: 'play_game', label: 'Play game ≥5 min together', basePts: 2 },
      { id: 'send_photo', label: 'Share 1 photo each', basePts: 3 },
    ],
    icon: Users,
    color: 'emerald',
  },
];

const TOTAL_POINTS_FOR_PROFILE_UNLOCK = 500;

const stageColorMap: Record<string, { bg: string; text: string; border: string; fill: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/20',    text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-800/40',    fill: 'bg-blue-500 dark:bg-blue-400' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40', fill: 'bg-purple-500 dark:bg-purple-400' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/40', fill: 'bg-orange-500 dark:bg-orange-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', fill: 'bg-emerald-500 dark:bg-emerald-400' },
};

export const MatchRoadmapModal: React.FC<MatchRoadmapModalProps> = ({
  open,
  onOpenChange,
  stage = 1,
  dayStreak = 0,
  stagePoints: _stagePoints = 0,
  matchPoints = 0,
  effectiveMultiplier = 1,
  dailyTasks = [],
  partnerAlias: _partnerAlias = 'Your match',
}) => {
  const currentStage = Math.min(4, Math.max(1, stage));
  const [selectedStageId, setSelectedStageId] = useState<number>(currentStage);
  const selectedStage = ROADMAP_STAGES.find((s) => s.id === selectedStageId) ?? ROADMAP_STAGES[0];
  const colors = stageColorMap[selectedStage.color];

  // 500-pt profile unlock calculation
  const isProfileUnlocked = matchPoints >= TOTAL_POINTS_FOR_PROFILE_UNLOCK;
  const pointsProgress = Math.min(100, Math.round((matchPoints / TOTAL_POINTS_FOR_PROFILE_UNLOCK) * 100));
  const pointsRemaining = Math.max(0, TOTAL_POINTS_FOR_PROFILE_UNLOCK - matchPoints);

  // Streak to next stage
  let nextStageDays = 3;
  if (currentStage === 2) nextStageDays = 7;
  else if (currentStage === 3) nextStageDays = 10;
  const daysToNextStage = Math.max(0, nextStageDays - dayStreak);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0',
          'bg-[#FAF9F5] dark:bg-[#121212] text-gray-900 dark:text-white',
          'border-2 border-gray-900/30 dark:border-white/15 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.85)]',
          'rounded-2xl custom-scrollbar [&>button.absolute]:hidden'
        )}
      >
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b-2 border-gray-900/20 dark:border-white/10 relative bg-[#1A6B3C] dark:bg-[#181818] text-white select-none">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-black/30 dark:bg-emerald-500/20 text-white dark:text-emerald-400 font-mono font-bold text-xs uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/20 dark:border-emerald-500/30">
                ALLY ROADMAP
              </span>
              <DialogTitle className="font-jakarta font-black text-xl sm:text-2xl uppercase tracking-tight text-white">
                Match Progression
              </DialogTitle>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg border border-white/30 dark:border-white/15 bg-black/20 dark:bg-white/10 hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-7 space-y-6">
          {/* ── 500-PT PROFILE UNLOCK STATUS CARD ── */}
          <div className="bg-white dark:bg-[#181818] border-2 border-gray-900/20 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔓</span>
                  <h3 className="font-jakarta font-black text-base sm:text-lg">
                    {isProfileUnlocked ? 'Profile & Real Identities Unlocked!' : 'Profile Unlock Goal (500 pts)'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isProfileUnlocked
                    ? 'You both reached 500 points! Real names, avatars, and bios are now revealed.'
                    : `${pointsRemaining} pts needed to reveal mutual real names, avatars, and profiles.`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono leading-none">
                    {matchPoints} <span className="text-xs font-normal text-gray-500">/ 500</span>
                  </p>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wide mt-0.5">Total Points</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none">
                    {effectiveMultiplier}×
                  </p>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wide mt-0.5">Multiplier</p>
                </div>
              </div>
            </div>

            {/* 500-pt progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden p-[1px]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    isProfileUnlocked
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                      : 'bg-gradient-to-r from-[#1A6B3C] via-emerald-500 to-teal-400'
                  )}
                  style={{ width: `${Math.max(pointsProgress > 0 ? 4 : 0, pointsProgress)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10.5px] font-mono text-gray-500 dark:text-gray-400">
                <span>{pointsProgress}% of 500 pts</span>
                <span>{isProfileUnlocked ? '🎉 UNLOCKED' : `${pointsRemaining} pts left`}</span>
              </div>
            </div>
          </div>

          {/* ── STREAK STAGES SUMMARY (3d, 7d, 10d) ── */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Flame size={20} className="fill-amber-100" />
              </div>
              <div>
                <p className="font-jakarta font-bold text-sm text-amber-900 dark:text-amber-200">
                  {dayStreak}-Day Daily Streak • Stage {currentStage} ({ROADMAP_STAGES[currentStage - 1]?.title})
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  {currentStage >= 4
                    ? 'Maximum Stage 4 reached! 4× multiplier active on all tasks.'
                    : `${daysToNextStage} more consecutive day${daysToNextStage === 1 ? '' : 's'} needed for Stage ${currentStage + 1} (${ROADMAP_STAGES[currentStage]?.thresholdDays}d threshold)`}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/50 px-2.5 py-1 rounded-lg">
                Stage {currentStage} Multiplier: {effectiveMultiplier}×
              </span>
            </div>
          </div>

          {/* ── STAGE SELECTOR + DETAILS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Stage list with 3d, 7d, 10d tags */}
            <div className="lg:col-span-5 space-y-2.5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white flex items-center gap-1.5 px-1">
                <Compass size={13} className="text-[#1A6B3C] dark:text-emerald-400" />
                Streak Stages (3d, 7d, 10d)
              </p>
              {ROADMAP_STAGES.map((s) => {
                const isUnlocked = s.id <= currentStage;
                const isSelected = s.id === selectedStageId;
                const IconComponent = s.icon;
                const c = stageColorMap[s.color];

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStageId(s.id)}
                    type="button"
                    className={cn(
                      'w-full p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer',
                      'flex items-center justify-between gap-3 group',
                      isSelected
                        ? `${c.border} ${c.bg} shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] -translate-y-0.5`
                        : isUnlocked
                        ? 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] hover:border-gray-300 dark:hover:border-white/20'
                        : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#161616] opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border',
                        isSelected ? `${c.fill} text-white border-transparent` : isUnlocked ? `${c.bg} ${c.text} ${c.border}` : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 border-gray-200 dark:border-neutral-700'
                      )}>
                        <IconComponent size={16} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-jakarta font-bold text-sm leading-tight truncate">{s.title}</h4>
                          <span className="text-[10px] font-mono text-gray-400">({s.thresholdDays}d)</span>
                        </div>
                        <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">{s.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5">
                      <span className={cn(
                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase',
                        isUnlocked ? `${c.bg} ${c.text} ${c.border}` : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 border-gray-200 dark:border-neutral-700'
                      )}>
                        {isUnlocked ? (s.id === currentStage ? 'Current' : 'Passed') : 'Locked'}
                      </span>
                      <ArrowRight size={14} className={cn('transition-transform', isSelected ? `${c.text} translate-x-0.5` : 'opacity-20')} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Stage detail */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-4">
                {/* Description */}
                <div className={cn('p-3.5 rounded-xl border', colors.bg, colors.border)}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn('font-mono text-[10px] font-bold uppercase tracking-wider', colors.text)}>
                      {selectedStage.tag}
                    </p>
                    <span className={cn('text-xs font-mono font-bold', colors.text)}>
                      {selectedStage.multiplier}× Multiplier
                    </span>
                  </div>
                  <p className="font-jakarta text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedStage.description}
                  </p>
                </div>

                {/* Daily tasks */}
                {selectedStage.tasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                      <Star size={12} className={colors.text} />
                      Daily Tasks <span className="text-gray-400 dark:text-gray-500 font-normal">(resets 12:00 AM PHT)</span>
                    </p>
                    {selectedStage.tasks.map((task) => {
                      const taskStatus = dailyTasks.find((t) => t.taskId === task.id);
                      const myDone = selectedStageId <= currentStage && taskStatus?.myCompleted;
                      const partnerDone = selectedStageId <= currentStage && taskStatus?.partnerCompleted;
                      const taskPts = task.basePts * effectiveMultiplier;

                      return (
                        <div key={task.id} className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border',
                          myDone ? `${colors.bg} ${colors.border}` : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'
                        )}>
                          <div className="flex flex-col gap-0.5">
                            {myDone ? (
                              <CheckCircle2 size={16} className={cn(colors.text)} />
                            ) : (
                              <Circle size={16} className="text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-jakarta text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{task.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-400">
                                You: {myDone ? '✓ Completed' : '○ Pending'} · Partner: {partnerDone ? '✓' : '○'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={cn('text-xs font-bold font-mono', colors.text)}>+{taskPts} pts</span>
                            <p className="text-[10px] text-gray-400 font-mono">({task.basePts} × {effectiveMultiplier}×)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedStage.id === 4 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                    <Users size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-jakarta">
                      Your feeds appear in each other's <strong>Allies newsfeed filter</strong> (still anonymous). Profiles unlock when reaching 500 total points!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── STAGE STREAK PROGRESS TRACK (0d -> 3d -> 7d -> 10d) ── */}
          <div className="bg-white dark:bg-[#181818] border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-gray-800 dark:text-white flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500" />
                Streak Milestones (3, 7, 10 Days)
              </span>
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {currentStage >= 4 ? '✓ Max Stage Reached!' : `${dayStreak} Days Current Streak`}
              </span>
            </div>

            {/* Stage milestone nodes */}
            <div className="relative flex items-center justify-between pt-2 pb-1 px-4">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[3px] bg-gray-200 dark:bg-neutral-800" />
              {ROADMAP_STAGES.map((s) => {
                const isReached = s.id <= currentStage;
                const IconComponent = s.icon;
                const c = stageColorMap[s.color];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStageId(s.id)}
                    title={`${s.title} (${s.thresholdDays}d)`}
                    className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
                        isReached ? `${c.fill} text-white border-transparent shadow-md scale-105` : 'bg-white dark:bg-[#1e1e1e] text-gray-400 border-gray-300 dark:border-white/15'
                      )}
                    >
                      {isReached ? <CheckCircle2 size={16} /> : <IconComponent size={15} />}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400">
                      {s.thresholdDays}d
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
