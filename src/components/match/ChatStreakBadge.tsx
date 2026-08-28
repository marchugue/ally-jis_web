// src/components/match/ChatStreakBadge.tsx
//
// Renders a TikTok-style streak badge — visible only when the pair has
// chatted on 3+ consecutive days. Below that threshold nothing is shown
// so new / cold conversations aren't cluttered with a "0-day streak".

import { useEffect, useRef } from 'react';

interface ChatStreakBadgeProps {
  /** Calendar-day consecutive-chat count (UTC). Hide badge when < 3. */
  dayStreak: number;
  /** Extra class names for positioning / spacing from the parent. */
  className?: string;
}

/** Minimum consecutive days before the badge becomes visible. */
const STREAK_THRESHOLD = 3;

export function ChatStreakBadge({ dayStreak, className = '' }: ChatStreakBadgeProps) {
  const glowRef = useRef<HTMLSpanElement>(null);

  // Kick a quick scale-bounce whenever the streak count increases.
  useEffect(() => {
    const el = glowRef.current;
    if (!el || dayStreak < STREAK_THRESHOLD) return;
    el.classList.remove('streak-pop');
    // Force reflow so removing + re-adding the class triggers the animation.
    void el.offsetWidth;
    el.classList.add('streak-pop');
  }, [dayStreak]);

  if (dayStreak < STREAK_THRESHOLD) return null;

  // Colour ramps: orange at 3, deeper amber at 7, red-hot at 14+.
  const hot = dayStreak >= 14;
  const warm = dayStreak >= 7;

  const gradientFrom = hot ? '#ff3b30' : warm ? '#ff9500' : '#ff6b00';
  const gradientTo   = hot ? '#ff6b00' : warm ? '#ffcc00' : '#ffaa00';

  return (
    <>
      {/* Inline keyframes — avoids a separate CSS file dependency. */}
      <style>{`
        @keyframes streak-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${gradientFrom}55; }
          50%       { box-shadow: 0 0 0 6px ${gradientFrom}00; }
        }
        @keyframes streak-flame {
          0%, 100% { transform: scaleY(1)   rotate(-2deg); }
          25%       { transform: scaleY(1.1) rotate(2deg); }
          75%       { transform: scaleY(0.95) rotate(-1deg); }
        }
        @keyframes streak-pop-anim {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.25); }
          70%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        .streak-pop { animation: streak-pop-anim 0.4s ease-out forwards; }
      `}</style>

      <span
        ref={glowRef}
        className={`inline-flex items-center gap-1 select-none ${className}`}
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          borderRadius: '999px',
          padding: '2px 8px 2px 6px',
          animation: 'streak-pulse 2s ease-in-out infinite',
        }}
        title={`${dayStreak}-day chat streak 🔥`}
      >
        {/* Animated flame emoji */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '13px',
            lineHeight: 1,
            animation: 'streak-flame 1.2s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
          aria-hidden
        >
          🔥
        </span>

        {/* Streak count */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.01em',
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          {dayStreak}
        </span>
      </span>
    </>
  );
}
