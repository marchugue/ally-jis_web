import React, { useState } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  Users,
  Eye,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MatchRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage?: number;
  dayStreak?: number;
  partnerAlias?: string | null;
  matchId?: string | null;
}

interface RoadmapStage {
  id: number;
  number: string;
  tag: string;
  streakLabel: string;
  title: string;
  subtitle: string;
  description: string;
  perks: string[];
  icon: React.ElementType;
  requiredStreakDays: number;
}

const ROADMAP_STAGES: RoadmapStage[] = [
  {
    id: 1,
    number: '01',
    tag: 'DAY 1 STREAK',
    streakLabel: '1-Day Chat',
    title: 'Anonymous Chat',
    subtitle: 'Safe Persona Messaging',
    description: 'Connect without judgment using encrypted persona identities and an initial handshake timer.',
    perks: ['Anonymous animal avatar', 'Handshake response window', 'Encrypted peer chat'],
    icon: Flame,
    requiredStreakDays: 1,
  },
  {
    id: 2,
    number: '02',
    tag: '3-DAY STREAK',
    streakLabel: '3-Day Streak',
    title: 'Shared Interests',
    subtitle: 'Mutual Campus Passions',
    description: 'Discover the passions that brought you together across hobbies, music, and campus studies.',
    perks: ['Shared interest tags', 'Favorite hobby previews', 'General study category'],
    icon: Sparkles,
    requiredStreakDays: 3,
  },
  {
    id: 3,
    number: '03',
    tag: '7-DAY STREAK',
    streakLabel: '7-Day Streak',
    title: 'Mutual Circles',
    subtitle: 'Organizations & Year Level',
    description: 'See where your student journeys cross paths across university clubs and academic batches.',
    perks: ['Mutual campus orgs', 'Academic year level', 'Shared university activities'],
    icon: Users,
    requiredStreakDays: 7,
  },
  {
    id: 4,
    number: '04',
    tag: '10-DAY STREAK',
    streakLabel: '10-Day Streak',
    title: 'Unlock Profile',
    subtitle: 'Mutual Profile Unlock',
    description: 'Transform your anonymous peer into a permanent verified campus ally with full profile access.',
    perks: ['Real student name', 'Unblurred profile photo', 'Course & academic program', 'Direct Ally status'],
    icon: Unlock,
    requiredStreakDays: 10,
  },
];

export const MatchRoadmapModal: React.FC<MatchRoadmapModalProps> = ({
  open,
  onOpenChange,
  stage = 1,
  dayStreak = 0,
  partnerAlias: _partnerAlias = 'Your match',
}) => {
  // Streak-based stage progression calculation
  const streakCalculatedStage =
    dayStreak >= 10 ? 4 : dayStreak >= 7 ? 3 : dayStreak >= 3 ? 2 : 1;
  const currentStage = Math.max(stage, streakCalculatedStage);

  const [selectedStageId, setSelectedStageId] = useState<number>(currentStage);

  const selectedStage = ROADMAP_STAGES.find((s) => s.id === selectedStageId) ?? ROADMAP_STAGES[0];
  const daysLeftToUnlock = Math.max(0, 10 - dayStreak);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[95vw] max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-0',
          'bg-[#FAF9F5] dark:bg-[#121212] text-gray-900 dark:text-white',
          'border-2 border-gray-900/30 dark:border-white/15 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.85)]',
          'rounded-2xl custom-scrollbar [&>button.absolute]:hidden'
        )}
      >
        {/* ── Modal Header: System Campus Green (Light) / Sleek Charcoal (Dark) ── */}
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
          {/* ── Desktop 2-Column Layout (Left: Milestones List | Right: Stage Dossier) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Stages Selection */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Compass size={14} className="stroke-[2.5] text-[#1A6B3C] dark:text-emerald-400" />
                  Roadmap Stages
                </span>
                <span className="font-mono text-[10px] text-gray-400 uppercase">
                  Click to inspect
                </span>
              </div>

              <div className="space-y-2.5">
                {ROADMAP_STAGES.map((s) => {
                  const isUnlocked = s.id <= currentStage;
                  const isSelected = s.id === selectedStageId;
                  const IconComponent = s.icon;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStageId(s.id)}
                      type="button"
                      className={cn(
                        'w-full p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative',
                        'flex items-center justify-between gap-3 group',
                        isSelected
                          ? 'border-[#1A6B3C] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/20 text-gray-900 dark:text-white shadow-[3px_3px_0px_0px_rgba(26,107,60,0.25)] dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] -translate-y-0.5'
                          : isUnlocked
                          ? 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-900 dark:text-white hover:border-[#1A6B3C]/60 dark:hover:border-emerald-400/40 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)]'
                          : 'border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-[#161616] text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-white/15'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                            isSelected
                              ? 'border-[#1A6B3C] dark:border-emerald-400 bg-[#1A6B3C] dark:bg-emerald-500 text-white dark:text-black'
                              : isUnlocked
                              ? 'border-[#1A6B3C]/30 dark:border-emerald-500/30 bg-[#1A6B3C]/10 dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-400'
                              : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-neutral-800 text-gray-400'
                          )}
                        >
                          <IconComponent size={18} className="stroke-[2.5]" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-jakarta font-bold text-sm sm:text-base leading-tight truncate">
                            {s.title}
                          </h4>
                          <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {s.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider',
                            isUnlocked
                              ? 'bg-[#1A6B3C]/10 text-[#1A6B3C] dark:bg-emerald-500/15 dark:text-emerald-400 border-[#1A6B3C]/30 dark:border-emerald-500/30'
                              : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700'
                          )}
                        >
                          {isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                        <ArrowRight
                          size={16}
                          className={cn(
                            'stroke-[2.5] transition-transform',
                            isSelected ? 'text-[#1A6B3C] dark:text-emerald-400 translate-x-1' : 'opacity-20 group-hover:opacity-60'
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Stage Dossier & Action Terminal */}
            <div className="lg:col-span-7">
              <div className="border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] space-y-6">

                {/* Stage Mission & Description */}
                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-[#141414]">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 mb-1">
                    STAGE OBJECTIVE
                  </p>
                  <p className="font-jakarta text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                    {selectedStage.description}
                  </p>
                </div>

                {/* Unlocks & Capabilities Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      Unlocked Capabilities & Data Access:
                    </p>
                    <span className="font-mono text-[10px] text-gray-400">
                      {selectedStage.perks.length} ATTRIBUTES
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedStage.perks.map((perk) => (
                      <div
                        key={perk}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#1E1E1E]"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#1A6B3C] dark:bg-emerald-500 text-white dark:text-black flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          ✓
                        </div>
                        <span className="font-jakarta text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {perk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clean text only: no green color, no border, no bg fill */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {daysLeftToUnlock === 0
                      ? '10-day streak reached • Profile unlocked'
                      : `${daysLeftToUnlock} days left • Keep chatting to unlock`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Progression Bar with 4 Icons Only (Streak Based) ── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] space-y-4">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-gray-900 dark:text-white">
              <span className="flex items-center gap-2">
                <Flame size={16} className="text-[#1A6B3C] dark:text-emerald-400 stroke-[2.5]" />
                <span>Streak Progression: {dayStreak} / 10 Days</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                {daysLeftToUnlock === 0
                  ? '✓ 10-Day Goal Achieved'
                  : `${daysLeftToUnlock} days left to full unlock`}
              </span>
            </div>

            {/* Continuous Track with 4 Icons Only */}
            <div className="relative flex items-center justify-between px-4 sm:px-8 py-3">
              {/* Background Connecting Track Line */}
              <div className="absolute left-8 right-8 sm:left-12 sm:right-12 top-1/2 -translate-y-1/2 h-2 bg-gray-200/90 dark:bg-neutral-800 rounded-full overflow-hidden">
                {/* Smooth Streak Fill Bar */}
                <div
                  className="h-full bg-[#1A6B3C] dark:bg-emerald-400 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(dayStreak > 0 ? 5 : 0, (dayStreak / 10) * 100))}%`,
                  }}
                />
              </div>

              {/* 4 Icons Only */}
              {ROADMAP_STAGES.map((s) => {
                const isUnlocked = dayStreak >= s.requiredStreakDays || s.id <= currentStage;
                const isSelected = s.id === selectedStageId;
                const IconComponent = s.icon;

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStageId(s.id)}
                    type="button"
                    title={`Stage ${s.number}: ${s.title} (${s.streakLabel})`}
                    className={cn(
                      'relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer select-none',
                      isSelected
                        ? 'scale-110 -translate-y-0.5 ring-3 ring-[#1A6B3C]/30 dark:ring-emerald-400/40'
                        : 'hover:scale-105',
                      isUnlocked
                        ? 'bg-[#1A6B3C] text-white border-[#1A6B3C] dark:bg-emerald-500 dark:text-black dark:border-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]'
                        : 'bg-white dark:bg-[#1e1e1e] text-gray-400 dark:text-gray-500 border-gray-300 dark:border-white/15'
                    )}
                  >
                    <IconComponent size={18} className="stroke-[2.5]" />
                    <span
                      className={cn(
                        'absolute -bottom-5 font-mono text-[10px] font-bold',
                        isUnlocked ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                      )}
                    >
                      {s.requiredStreakDays}d
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-1" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
