// src/components/match/ChatStreakBadge.tsx
//
// Renders the streak badge:
// - Visible for any active streak (dayStreak > 0)
// - Minimalist: only the emoji and text, no capsule/pill background
// - Active today: vibrant fire emoji & orange text
// - Pending today: muted/grayscale fire emoji & gray text
// - Interactive tooltip & pop animation on update

import React, { useEffect, useRef } from 'react';
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

  const tooltipText = isStreakActiveToday
    ? `${dayStreak}-day streak • Active today! 🔥`
    : `${dayStreak}-day streak • Not yet activated today (send a message to activate)`;

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
          'group inline-flex items-center select-none font-jakarta font-bold transition-all duration-200 bg-transparent border-0 p-0',
          isSm ? 'gap-0.5 text-[11px] leading-none' : 'gap-1 text-xs leading-none',
          isStreakActiveToday
            ? 'text-[#eb5600] dark:text-orange-400'
            : 'text-gray-400 dark:text-gray-500',
          onClick && 'cursor-pointer hover:opacity-80 active:scale-95',
          className
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block select-none transition-transform duration-200 group-hover:scale-110',
            isSm ? 'text-xs' : 'text-sm',
            !isStreakActiveToday && 'grayscale opacity-50'
          )}
        >
          🔥
        </span>
        <span>
          {dayStreak}
          {showDaysSuffix ? 'd' : ''}
        </span>
      </Comp>
    </>
  );
};
