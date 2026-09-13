// src/components/match/ChatStreakBadge.tsx
//
// Renders the mobile-aligned streak badge:
// - Visible for any active streak (dayStreak > 0)
// - Active today: warm orange tint background, orange Flame icon & text
// - Pending today: soft gray pill, muted gray Flame icon & text
// - Interactive tooltip & pop animation on update

import React, { useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatStreakBadgeProps {
  /** Consecutive day streak count. Badge is visible when dayStreak > 0. */
  dayStreak: number;
  /** True when both participants have chatted today (or streak confirmed today). */
  isStreakActiveToday?: boolean;
  /** Size variant: 'sm' (header default, 11px font) or 'md' (12px font). */
  size?: 'sm' | 'md';
  /** Whether to append 'd' to the number (e.g. "3d" instead of "3"). Default false. */
  showDaysSuffix?: boolean;
  /** Extra CSS classes. */
  className?: string;
  /** Optional click handler. */
  onClick?: () => void;
}

export const ChatStreakBadge: React.FC<ChatStreakBadgeProps> = ({
  dayStreak,
  isStreakActiveToday = false,
  size = 'sm',
  showDaysSuffix = false,
  className = '',
  onClick,
}) => {
  const badgeRef = useRef<any>(null);

  // Trigger pop animation whenever the streak count increases or status changes
  useEffect(() => {
    const el = badgeRef.current;
    if (!el || dayStreak <= 0) return;
    el.classList.remove('streak-pop');
    void el.offsetWidth; // Force reflow
    el.classList.add('streak-pop');
  }, [dayStreak, isStreakActiveToday]);

  if (!dayStreak || dayStreak <= 0) return null;

  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 14;

  const tooltipText = isStreakActiveToday
    ? `${dayStreak}-day streak • Active today! 🔥`
    : `${dayStreak}-day streak • Pending today (send a message to maintain)`;

  const Comp = onClick ? 'button' : 'span';

  return (
    <>
      <style>{`
        @keyframes streak-pop-anim {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.15); }
          75%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .streak-pop {
          animation: streak-pop-anim 0.35s ease-out forwards;
        }
      `}</style>

      <Comp
        ref={badgeRef}
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        title={tooltipText}
        aria-label={tooltipText}
        className={cn(
          'group inline-flex items-center select-none font-jakarta font-bold transition-all duration-200',
          isSm ? 'gap-1 px-2 py-0.5 rounded-lg text-[11px] leading-tight' : 'gap-1.5 px-2.5 py-1 rounded-lg text-xs',
          isStreakActiveToday
            ? 'bg-[#eb5600]/10 text-[#eb5600] border border-[#eb5600]/20 dark:bg-[#eb5600]/20 dark:text-orange-400 dark:border-[#eb5600]/30'
            : 'bg-gray-100 text-gray-500 border border-gray-200/60 dark:bg-white/10 dark:text-gray-400 dark:border-white/5',
          onClick && 'cursor-pointer hover:opacity-90 active:scale-95',
          className
        )}
      >
        <Flame
          size={iconSize}
          className={cn(
            'flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
            isStreakActiveToday
              ? 'text-[#eb5600] dark:text-orange-400 fill-[#eb5600] dark:fill-orange-400'
              : 'text-gray-400 dark:text-gray-500 fill-gray-300 dark:fill-gray-600'
          )}
        />
        <span>
          {dayStreak}
          {showDaysSuffix ? 'd' : ''}
        </span>
      </Comp>
    </>
  );
};
